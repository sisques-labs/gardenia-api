import { Inject, Logger } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  ISpaceQrPort,
  SPACE_QR_PORT,
} from '@contexts/spaces/application/ports/space-qr.port';
import { InviteCodeGeneratorService } from '@contexts/spaces/application/services/write/invite-code-generator/invite-code-generator.service';
import { SpaceInvitationTargetUrlBuilderService } from '@contexts/spaces/application/services/write/space-invitation-target-url-builder/space-invitation-target-url-builder.service';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { MembershipFindByUserAndSpaceQuery } from '@contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.query';
import { SpaceInvitationAggregate } from '@contexts/spaces/domain/aggregates/space-invitation.aggregate';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';
import {
  ISpaceInvitationWriteRepository,
  SPACE_INVITATION_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { CreateSpaceInvitationCommand } from './create-space-invitation.command';

const DEFAULT_EXPIRY_HOURS = 24;
const MAX_CODE_COLLISION_RETRIES = 5;

@CommandHandler(CreateSpaceInvitationCommand)
export class CreateSpaceInvitationCommandHandler
  extends BaseCommandHandler<
    CreateSpaceInvitationCommand,
    SpaceInvitationAggregate
  >
  implements
    ICommandHandler<CreateSpaceInvitationCommand, SpaceInvitationViewModel>
{
  private readonly logger = new Logger(
    CreateSpaceInvitationCommandHandler.name,
  );

  constructor(
    @Inject(SPACE_INVITATION_WRITE_REPOSITORY)
    private readonly spaceInvitationWriteRepository: ISpaceInvitationWriteRepository,
    private readonly assertSpaceExistsService: AssertSpaceExistsService,
    private readonly inviteCodeGeneratorService: InviteCodeGeneratorService,
    private readonly targetUrlBuilder: SpaceInvitationTargetUrlBuilderService,
    @Inject(SPACE_QR_PORT)
    private readonly spaceQrPort: ISpaceQrPort,
    private readonly spaceInvitationBuilder: SpaceInvitationBuilder,
    private readonly queryBus: QueryBus,
    private readonly spaceContext: SpaceContext,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: CreateSpaceInvitationCommand,
  ): Promise<SpaceInvitationViewModel> {
    const space = await this.assertSpaceExistsService.execute(command.spaceId);

    const requesterMembership = await this.queryBus.execute<
      MembershipFindByUserAndSpaceQuery,
      SpaceMembership | null
    >(
      new MembershipFindByUserAndSpaceQuery({
        userId: command.requestingUserId.value,
        spaceId: command.spaceId.value,
      }),
    );

    if (!requesterMembership) {
      throw new NotASpaceMemberException(
        command.requestingUserId.value,
        command.spaceId.value,
      );
    }

    if (!requesterMembership.role.isOwner()) {
      throw new NotSpaceOwnerException(
        command.requestingUserId.value,
        command.spaceId.value,
      );
    }

    const now = new Date();
    const expiresAt =
      command.expiresAt ??
      new Date(now.getTime() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

    return this.spaceContext.run(command.spaceId.value, async () => {
      const { code, displayCode } = await this.generateUniqueCode(
        space.name.value,
      );
      const targetUrl = await this.targetUrlBuilder.execute({ displayCode });
      const qrId = await this.spaceQrPort.createInvitationQr({
        targetUrl,
        spaceId: command.spaceId.value,
        expiresAt,
      });

      const invitation = this.spaceInvitationBuilder
        .withId(UuidValueObject.generate().value)
        .withSpaceId(command.spaceId.value)
        .withCreatedByUserId(command.requestingUserId.value)
        .withRole(command.role.value as MembershipRoleEnum)
        .withCode(code)
        .withDisplayCode(displayCode)
        .withQrId(qrId)
        .withExpiresAt(expiresAt)
        .withCreatedAt(now)
        .withUpdatedAt(now)
        .build();

      invitation.create();
      await this.spaceInvitationWriteRepository.save(invitation);
      await this.publishEvents(invitation);

      this.logger.log(
        `Space invitation created: ${invitation.id.value} for space ${command.spaceId.value}`,
      );

      return this.spaceInvitationBuilder
        .withId(invitation.id.value)
        .withSpaceId(invitation.spaceId.value)
        .withCreatedByUserId(invitation.createdByUserId.value)
        .withRole(invitation.role.value as MembershipRoleEnum)
        .withCode(invitation.code.value)
        .withDisplayCode(invitation.displayCode.value)
        .withQrId(invitation.qrId?.value ?? null)
        .withExpiresAt(invitation.expiresAt.value)
        .withCreatedAt(invitation.createdAt.value)
        .withUpdatedAt(invitation.updatedAt.value)
        .buildViewModel();
    });
  }

  private async generateUniqueCode(
    spaceName: string,
  ): Promise<{ code: string; displayCode: string }> {
    for (let attempt = 0; attempt < MAX_CODE_COLLISION_RETRIES; attempt++) {
      const generated = await this.inviteCodeGeneratorService.execute({
        spaceName,
      });
      const existing = await this.spaceInvitationWriteRepository.findByCode(
        generated.code,
      );
      if (!existing) {
        return generated;
      }
    }

    throw new Error('Failed to generate a unique invitation code');
  }
}
