import { Inject, Logger } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import {
  ISpaceUserPort,
  SPACE_USER_PORT,
} from '@contexts/spaces/application/ports/space-user.port';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { MembershipFindByUserAndSpaceQuery } from '@contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.query';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { DuplicateMembershipException } from '@contexts/spaces/domain/exceptions/duplicate-membership.exception';
import { InvitationExpiredException } from '@contexts/spaces/domain/exceptions/invitation-expired.exception';
import { InvitationNotFoundException } from '@contexts/spaces/domain/exceptions/invitation-not-found.exception';
import {
  ISpaceInvitationReadRepository,
  SPACE_INVITATION_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

import { AcceptSpaceInvitationCommand } from './accept-space-invitation.command';

export interface AcceptSpaceInvitationResult {
  spaceId: string;
  role: MembershipRoleEnum;
}

@CommandHandler(AcceptSpaceInvitationCommand)
export class AcceptSpaceInvitationCommandHandler
  extends BaseCommandHandler<AcceptSpaceInvitationCommand, SpaceAggregate>
  implements
    ICommandHandler<AcceptSpaceInvitationCommand, AcceptSpaceInvitationResult>
{
  private readonly logger = new Logger(
    AcceptSpaceInvitationCommandHandler.name,
  );

  constructor(
    @Inject(SPACE_INVITATION_READ_REPOSITORY)
    private readonly spaceInvitationReadRepository: ISpaceInvitationReadRepository,
    private readonly assertSpaceExistsService: AssertSpaceExistsService,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    @Inject(SPACE_USER_PORT)
    private readonly spaceUserPort: ISpaceUserPort,
    private readonly queryBus: QueryBus,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: AcceptSpaceInvitationCommand,
  ): Promise<AcceptSpaceInvitationResult> {
    const invitation = await this.spaceInvitationReadRepository.findByCode(
      command.code.value,
    );

    if (!invitation) {
      throw new InvitationNotFoundException(command.code.value);
    }

    if (invitation.expiresAt < new Date()) {
      throw new InvitationExpiredException(command.code.value);
    }

    const existingMembership = await this.queryBus.execute<
      MembershipFindByUserAndSpaceQuery,
      SpaceMembership | null
    >(
      new MembershipFindByUserAndSpaceQuery({
        userId: command.acceptingUserId.value,
        spaceId: invitation.spaceId,
      }),
    );

    if (existingMembership) {
      throw new DuplicateMembershipException(
        command.acceptingUserId.value,
        invitation.spaceId,
      );
    }

    await this.spaceUserPort.ensureUserExists(command.acceptingUserId.value);

    const space = await this.assertSpaceExistsService.execute(
      new SpaceIdValueObject(invitation.spaceId),
    );

    space.addMember(command.acceptingUserId.value, invitation.role);
    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `User ${command.acceptingUserId.value} accepted invitation for space ${invitation.spaceId}`,
    );

    return {
      spaceId: invitation.spaceId,
      role: invitation.role,
    };
  }
}
