import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import {
  ITenantProvisioningPort,
  TENANT_PROVISIONING_PORT,
} from '@contexts/spaces/application/ports/tenant-provisioning.port';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { AddMemberCommand } from './add-member.command';

/**
 * `space-tenant-mapping` spec's "Platform Write Authority for Membership":
 * for a platform-linked request (D7's per-request pattern — see
 * `CreateSpaceCommandHandler`), the write is delegated to the platform FIRST
 * and the local projection reflects ONLY the platform's confirmed result,
 * never a locally-invented membership. A native request keeps today's
 * unchanged local-only write.
 *
 * Tenant id resolution follows D6's `external_tenant_id ?? space.id`
 * formula, which reduces to `space.id` for the whole scope of this SDD
 * change (see `SyncSpaceMembershipProjectionCommand`'s doc comment).
 */
@CommandHandler(AddMemberCommand)
export class AddMemberCommandHandler
  extends BaseCommandHandler<AddMemberCommand, SpaceAggregate>
  implements ICommandHandler<AddMemberCommand, void>
{
  private readonly logger = new Logger(AddMemberCommandHandler.name);

  constructor(
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    private readonly assertSpaceExistsService: AssertSpaceExistsService,
    @Inject(TENANT_PROVISIONING_PORT)
    private readonly tenantProvisioningPort: ITenantProvisioningPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: AddMemberCommand): Promise<void> {
    const space = await this.assertSpaceExistsService.execute(command.spaceId);

    const requesterMembership = space.memberships.find(
      (m) => m.userId === command.requestingUserId.value,
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

    if (command.platformAccessToken) {
      const confirmed = await this.tenantProvisioningPort.addMember(
        command.platformAccessToken,
        command.spaceId.value,
        {
          userId: command.targetUserId.value,
          role: command.role.value as MembershipRoleEnum,
        },
      );
      space.addMember(confirmed.userId, this.toLocalRole(confirmed.role));
    } else {
      space.addMember(
        command.targetUserId.value,
        command.role.value as MembershipRoleEnum,
      );
    }

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Member ${command.targetUserId.value} added to space ${command.spaceId.value} by ${command.requestingUserId.value}`,
    );
  }

  private toLocalRole(platformRole: string): MembershipRoleEnum {
    return platformRole?.toLowerCase() === MembershipRoleEnum.OWNER
      ? MembershipRoleEnum.OWNER
      : MembershipRoleEnum.MEMBER;
  }
}
