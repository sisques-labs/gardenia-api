import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { AddMemberCommand } from '@contexts/spaces/application/commands/add-member/add-member.command';
import { CreateSpaceCommand } from '@contexts/spaces/application/commands/create-space/create-space.command';
import { CreateSpaceInvitationCommand } from '@contexts/spaces/application/commands/create-space-invitation/create-space-invitation.command';
import { RemoveMemberCommand } from '@contexts/spaces/application/commands/remove-member/remove-member.command';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceFindByIdQuery } from '@contexts/spaces/application/queries/space-find-by-id/space-find-by-id.query';
import { SpacesFindByUserQuery } from '@contexts/spaces/application/queries/spaces-find-by-user/spaces-find-by-user.query';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';

import { SkipSpace } from '../../../../../shared/decorators/skip-space.decorator';
import { AddMemberDto } from '../dtos/add-member.dto';
import { CreateSpaceDto } from '../dtos/create-space.dto';
import { CreateSpaceInvitationDto } from '../dtos/create-space-invitation.dto';
import { SpaceInvitationRestResponseDto } from '../dtos/space-invitation-rest-response.dto';
import { SpaceRestResponseDto } from '../dtos/space-rest-response.dto';
import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';
import { SpaceRestMapper } from '../mappers/space/space.mapper';

@ApiTags('spaces')
@ApiBearerAuth()
@Controller('spaces')
export class SpacesController {
  private readonly logger = new Logger(SpacesController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly spaceRestMapper: SpaceRestMapper,
    private readonly spaceInvitationRestMapper: SpaceInvitationRestMapper,
  ) {}

  @Post()
  @SkipSpace()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new space' })
  @ApiResponse({
    status: 201,
    description: 'Space created successfully',
    type: SpaceRestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Space limit exceeded' })
  async createSpace(
    @Body() dto: CreateSpaceDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SpaceRestResponseDto> {
    const spaceId = await this.commandBus.execute<CreateSpaceCommand, string>(
      new CreateSpaceCommand({ name: dto.name, ownerId: user.userId }),
    );
    const vm = await this.queryBus.execute<SpaceFindByIdQuery, SpaceViewModel>(
      new SpaceFindByIdQuery({ spaceId }),
    );
    return this.spaceRestMapper.toResponse(vm);
  }

  @Get('me')
  @SkipSpace()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List all spaces where the current user is a member',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all spaces for the current user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMySpaces(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PaginatedResult<SpaceRestResponseDto>> {
    const result = await this.queryBus.execute<
      SpacesFindByUserQuery,
      PaginatedResult<SpaceViewModel>
    >(new SpacesFindByUserQuery({ userId: user.userId }));

    const items = result.items.map((vm) => this.spaceRestMapper.toResponse(vm));
    return new PaginatedResult(
      items,
      result.total,
      result.page,
      result.perPage,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a space by ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the space',
    type: SpaceRestResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Missing X-Space-ID header' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this space' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  async getSpace(@Param('id') id: string): Promise<SpaceRestResponseDto> {
    const vm = await this.queryBus.execute<SpaceFindByIdQuery, SpaceViewModel>(
      new SpaceFindByIdQuery({ spaceId: id }),
    );
    return this.spaceRestMapper.toResponse(vm);
  }

  @Post(':id/invitations')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a space invitation with QR and code' })
  @ApiResponse({
    status: 201,
    description: 'Invitation created',
    type: SpaceInvitationRestResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only the owner can create invitations',
  })
  async createInvitation(
    @Param('id') id: string,
    @Body() dto: CreateSpaceInvitationDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<SpaceInvitationRestResponseDto> {
    this.logger.log(
      `Creating invitation for space ${id} by user ${user.userId}`,
    );

    const vm = await this.commandBus.execute<
      CreateSpaceInvitationCommand,
      SpaceInvitationViewModel
    >(
      new CreateSpaceInvitationCommand({
        spaceId: id,
        requestingUserId: user.userId,
        role: dto.role,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      }),
    );

    return this.spaceInvitationRestMapper.toResponse(vm);
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a member to a space' })
  @ApiResponse({ status: 201, description: 'Member added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or missing X-Space-ID header',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only the owner can add members' })
  @ApiResponse({ status: 404, description: 'Space not found' })
  @ApiResponse({ status: 409, description: 'User is already a member' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new AddMemberCommand({
        spaceId: id,
        targetUserId: dto.userId,
        requestingUserId: user.userId,
      }),
    );
  }

  @Delete(':id/members/:userId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member from a space' })
  @ApiResponse({ status: 204, description: 'Member removed successfully' })
  @ApiResponse({ status: 400, description: 'Missing X-Space-ID header' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Only the owner can remove members',
  })
  @ApiResponse({ status: 404, description: 'Space or member not found' })
  @ApiResponse({ status: 422, description: 'Cannot remove the last owner' })
  async removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new RemoveMemberCommand({
        spaceId: id,
        targetUserId: userId,
        requestingUserId: user.userId,
      }),
    );
  }
}
