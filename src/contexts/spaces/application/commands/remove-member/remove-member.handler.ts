import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import {
  ITenantProvisioningPort,
  TENANT_PROVISIONING_PORT,
} from '@contexts/spaces/application/ports/tenant-provisioning.port';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { NotASpaceMemberException } from '@contexts/spaces/domain/exceptions/not-a-space-member.exception';
import { NotSpaceOwnerException } from '@contexts/spaces/domain/exceptions/not-space-owner.exception';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { RemoveMemberCommand } from './remove-member.command';

/**
 * `space-tenant-mapping` spec's "Platform Write Authority for Membership" —
 * see `AddMemberCommandHandler`'s doc comment for the same two-path pattern
 * applied to removal.
 */
@CommandHandler(RemoveMemberCommand)
export class RemoveMemberCommandHandler
  extends BaseCommandHandler<RemoveMemberCommand, SpaceAggregate>
  implements ICommandHandler<RemoveMemberCommand, void>
{
  private readonly logger = new Logger(RemoveMemberCommandHandler.name);

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

  async execute(command: RemoveMemberCommand): Promise<void> {
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
      await this.tenantProvisioningPort.removeMember(
        command.platformAccessToken,
        command.spaceId.value,
        command.targetUserId.value,
      );
    }

    space.removeMember(command.targetUserId.value);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Member ${command.targetUserId.value} removed from space ${command.spaceId.value} by ${command.requestingUserId.value}`,
    );
  }
}
