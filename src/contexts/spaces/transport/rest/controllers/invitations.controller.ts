import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { AcceptSpaceInvitationResult } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.handler';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { IdentityOnly } from '@shared/decorators/identity-only.decorator';

import { AcceptSpaceInvitationDto } from '../dtos/accept-space-invitation.dto';
import { AcceptSpaceInvitationResponseDto } from '../dtos/accept-space-invitation-response.dto';
import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';

@ApiTags('invitations')
@ApiBearerAuth()
@Controller('invitations')
export class InvitationsController {
  private readonly logger = new Logger(InvitationsController.name);

  constructor(
    private readonly commandBus: CommandBus,
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

    const result = await this.resolveInvitationSpaceContextService.run(
      dto.code,
      () =>
        this.commandBus.execute<
          AcceptSpaceInvitationCommand,
          AcceptSpaceInvitationResult
        >(
          new AcceptSpaceInvitationCommand({
            code: dto.code,
            acceptingUserId: user.userId,
          }),
        ),
    );

    return this.mapper.toAcceptResponse(result);
  }
}
