import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import {
  ITenantProvisioningPort,
  TENANT_PROVISIONING_PORT,
} from '@contexts/spaces/application/ports/tenant-provisioning.port';

import { CreateSpaceCommand } from './create-space.command';

@CommandHandler(CreateSpaceCommand)
export class CreateSpaceCommandHandler
  extends BaseCommandHandler<CreateSpaceCommand, SpaceAggregate>
  implements ICommandHandler<CreateSpaceCommand, string>
{
  private readonly logger = new Logger(CreateSpaceCommandHandler.name);
  private readonly maxSpacesPerUser: number;

  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    @Inject(TENANT_PROVISIONING_PORT)
    private readonly tenantProvisioningPort: ITenantProvisioningPort,
    configService: ConfigService,
    private readonly spaceBuilder: SpaceBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
    this.maxSpacesPerUser = configService.getOrThrow<number>(
      'spaces.maxSpacesPerUser',
    );
  }

  async execute(command: CreateSpaceCommand): Promise<string> {
    const maxSpaces = this.maxSpacesPerUser;
    const ownedCount = await this.membershipReadRepository.countByOwner(
      command.ownerId.value,
    );

    if (ownedCount >= maxSpaces) {
      throw new SpaceLimitExceededException(command.ownerId.value, maxSpaces);
    }

    const spaceId = await this.resolveSpaceId(command);

    const now = new Date();
    const space = this.spaceBuilder
      .withId(spaceId)
      .withName(command.name.value)
      .withOwnerId(command.ownerId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    space.create();
    space.addMember(command.ownerId.value, MembershipRoleEnum.OWNER);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Space created: ${space.id.value} for owner: ${command.ownerId.value}`,
    );

    return space.id.value;
  }

  /**
   * D6/D7 two-path branching. `POST /tenants` accepts no caller-supplied id
   * (D6), so a platform-linked request provisions the tenant FIRST and
   * adopts the returned UUID verbatim as `space.id` — literal parity, no
   * mapping table. A native (non-platform) request keeps today's behavior
   * unchanged: a locally-generated id, `external_tenant_id` left NULL.
   *
   * Per D7, `createTenant()` relays the acting user's own already-verified
   * platform bearer token — never a service-account credential. If
   * provisioning fails (account-api unreachable, 5xx, ...) the port throws
   * `TenantProvisioningUnavailableException`, which is left to propagate
   * here: Space creation fails explicitly rather than silently degrading a
   * platform-linked request into an unlinked native space.
   */
  private async resolveSpaceId(command: CreateSpaceCommand): Promise<string> {
    if (!command.platformAccessToken) {
      return UuidValueObject.generate().value;
    }

    return this.tenantProvisioningPort.createTenant(
      command.platformAccessToken,
      { name: command.name.value },
    );
  }
}
