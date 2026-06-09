import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  ISpaceQrPort,
  SPACE_QR_PORT,
} from '@contexts/spaces/application/ports/space-qr.port';
import { SpaceInvitationTargetUrlBuilderService } from '@contexts/spaces/application/services/write/space-invitation-target-url-builder/space-invitation-target-url-builder.service';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertUserIsSpaceMemberService } from '@contexts/spaces/application/services/write/assert-user-is-space-member/assert-user-is-space-member.service';
import { AssertUserIsSpaceOwnerService } from '@contexts/spaces/application/services/write/assert-user-is-space-owner/assert-user-is-space-owner.service';
import { GenerateUniqueInvitationCodeService } from '@contexts/spaces/application/services/write/generate-unique-invitation-code/generate-unique-invitation-code.service';
import { SpaceInvitationAggregate } from '@contexts/spaces/domain/aggregates/space-invitation.aggregate';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import {
  ISpaceInvitationWriteRepository,
  SPACE_INVITATION_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';

import { CreateSpaceInvitationCommand } from './create-space-invitation.command';

const DEFAULT_EXPIRY_HOURS = 24;

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
    private readonly assertUserIsSpaceMemberService: AssertUserIsSpaceMemberService,
    private readonly assertUserIsSpaceOwnerService: AssertUserIsSpaceOwnerService,
    private readonly generateUniqueInvitationCodeService: GenerateUniqueInvitationCodeService,
    private readonly targetUrlBuilder: SpaceInvitationTargetUrlBuilderService,
    @Inject(SPACE_QR_PORT)
    private readonly spaceQrPort: ISpaceQrPort,
    private readonly spaceInvitationBuilder: SpaceInvitationBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: CreateSpaceInvitationCommand,
  ): Promise<SpaceInvitationViewModel> {
    const space = await this.assertSpaceExistsService.execute(command.spaceId);

    const requesterMembership =
      await this.assertUserIsSpaceMemberService.execute({
        userId: command.requestingUserId.value,
        spaceId: command.spaceId.value,
      });

    await this.assertUserIsSpaceOwnerService.execute({
      membership: requesterMembership,
      userId: command.requestingUserId.value,
      spaceId: command.spaceId.value,
    });

    const now = new Date();
    const expiresAt =
      command.expiresAt ??
      new Date(now.getTime() + DEFAULT_EXPIRY_HOURS * 60 * 60 * 1000);

    const { code, displayCode } =
      await this.generateUniqueInvitationCodeService.execute({
        spaceName: space.name.value,
      });
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
  }
}
