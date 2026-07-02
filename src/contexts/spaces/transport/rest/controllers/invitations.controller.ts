import {
  Body,
  Controller,
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

import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { SpaceInvitationPreviewFindByCodeQuery } from '@contexts/spaces/application/queries/space-invitation-preview-find-by-code/space-invitation-preview-find-by-code.query';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import { SpaceInvitationPreviewViewModel } from '@contexts/spaces/domain/view-models/space-invitation-preview.view-model';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { IdentityOnly } from '@shared/decorators/identity-only.decorator';
import { SkipSpace } from '@shared/decorators/skip-space.decorator';

import { AcceptSpaceInvitationDto } from '../dtos/accept-space-invitation.dto';
import { AcceptSpaceInvitationResponseDto } from '../dtos/accept-space-invitation-response.dto';
import { SpaceInvitationPreviewResponseDto } from '../dtos/space-invitation-preview-response.dto';
import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mapper: SpaceInvitationRestMapper,
    private readonly resolveInvitationSpaceContextService: ResolveInvitationSpaceContextService,
  ) {}

  @Post('accept')
  @IdentityOnly()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a space invitation by code' })
  @ApiResponse({ status: 200, type: AcceptSpaceInvitationResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  @ApiResponse({ status: 410, description: 'Invitation expired' })
  async acceptInvitation(
    @Body() dto: AcceptSpaceInvitationDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AcceptSpaceInvitationResponseDto> {
    this.logger.log(
      `Accepting invitation for user ${user.userId} with code ${dto.code}`,
    );

    const spaceId = await this.resolveInvitationSpaceContextService.run(
      dto.code,
      () =>
        this.commandBus.execute<AcceptSpaceInvitationCommand, string>(
          new AcceptSpaceInvitationCommand({
            code: dto.code,
            acceptingUserId: user.userId,
          }),
        ),
    );

    return this.mapper.toAcceptResponse(user.userId, spaceId);
  }

  @Get(':code')
  @SkipSpace()
  @ApiOperation({ summary: 'Preview a space invitation by code (public)' })
  @ApiResponse({ status: 200, type: SpaceInvitationPreviewResponseDto })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getPreview(
    @Param('code') code: string,
  ): Promise<SpaceInvitationPreviewResponseDto> {
    this.logger.log(`Previewing invitation with code ${code}`);

    const preview = await this.queryBus.execute<
      SpaceInvitationPreviewFindByCodeQuery,
      SpaceInvitationPreviewViewModel
    >(new SpaceInvitationPreviewFindByCodeQuery({ code }));

    return this.mapper.toPreviewResponse(preview);
  }
}
