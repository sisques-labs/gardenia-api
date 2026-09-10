import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { TenantMembershipQueryUnavailableException } from '@contexts/spaces/domain/exceptions/tenant-membership-query-unavailable.exception';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  IMembershipWriteRepository,
  MEMBERSHIP_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/membership-write.repository';
import {
  ITenantMembershipQueryPort,
  TENANT_MEMBERSHIP_QUERY_PORT,
} from '@contexts/spaces/application/ports/tenant-membership-query.port';

import { SyncSpaceMembershipProjectionCommand } from './sync-space-membership-projection.command';

/**
 * Reconciles the local membership projection for ONE (userId, tenantId) pair
 * against the platform's confirmed response (design.md D4). Deliberately NOT
 * routed through `SpaceAggregate`/`ISpaceWriteRepository` — see
 * `IMembershipWriteRepository`'s doc comment for why.
 *
 * Returns `true` when the caller's request may proceed (membership confirmed,
 * or the platform is unreachable but a fresh-enough row already exists) and
 * `false` when the caller MUST be denied (403, absent from the platform's
 * member list, or unreachable with no cached row — fail-closed per the
 * `space-tenant-mapping` spec's "Fail-Closed Consistency" requirement).
 */
@CommandHandler(SyncSpaceMembershipProjectionCommand)
export class SyncSpaceMembershipProjectionCommandHandler implements ICommandHandler<
  SyncSpaceMembershipProjectionCommand,
  boolean
> {
  private readonly logger = new Logger(
    SyncSpaceMembershipProjectionCommandHandler.name,
  );

  constructor(
    @Inject(TENANT_MEMBERSHIP_QUERY_PORT)
    private readonly tenantMembershipQueryPort: ITenantMembershipQueryPort,
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
    @Inject(MEMBERSHIP_WRITE_REPOSITORY)
    private readonly membershipWriteRepository: IMembershipWriteRepository,
  ) {}

  async execute(
    command: SyncSpaceMembershipProjectionCommand,
  ): Promise<boolean> {
    const tenantId = command.tenantId.value;
    const userId = command.userId.value;

    try {
      const members = await this.tenantMembershipQueryPort.listMembers(
        tenantId,
        command.callerAccessToken,
      );

      if (members === null) {
        return this.revoke(userId, tenantId, 'platform returned 403');
      }

      const callerEntry = members.find((member) => member.userId === userId);
      if (!callerEntry) {
        return this.revoke(
          userId,
          tenantId,
          'caller absent from the platform member list',
        );
      }

      await this.membershipWriteRepository.upsert(
        userId,
        tenantId,
        this.toLocalRole(callerEntry.role),
        new Date(),
      );
      return true;
    } catch (error) {
      if (error instanceof TenantMembershipQueryUnavailableException) {
        return this.handlePlatformUnavailable(userId, tenantId);
      }
      throw error;
    }
  }

  private async revoke(
    userId: string,
    tenantId: string,
    reason: string,
  ): Promise<false> {
    this.logger.warn(
      `Revoking local membership projection for user ${userId} in tenant ${tenantId}: ${reason}`,
    );
    await this.membershipWriteRepository.deleteByUserAndSpace(userId, tenantId);
    return false;
  }

  private async handlePlatformUnavailable(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const hasExistingRow = await this.hasExistingRow(userId, tenantId);

    if (hasExistingRow) {
      this.logger.warn(
        `Platform membership sync unavailable for tenant ${tenantId}; keeping the existing row (bounded by TTL staleness)`,
      );
      return true;
    }

    this.logger.warn(
      `Platform membership sync unavailable for tenant ${tenantId} with no cached row; failing closed`,
    );
    return false;
  }

  private async hasExistingRow(
    userId: string,
    tenantId: string,
  ): Promise<boolean> {
    const criteria = new Criteria([
      { field: 'userId', operator: FilterOperator.EQUALS, value: userId },
      { field: 'spaceId', operator: FilterOperator.EQUALS, value: tenantId },
    ]);
    const result = await this.membershipReadRepository.findByCriteria(criteria);
    return result.total > 0;
  }

  private toLocalRole(platformRole: string): MembershipRoleEnum {
    return platformRole?.toLowerCase() === MembershipRoleEnum.OWNER
      ? MembershipRoleEnum.OWNER
      : MembershipRoleEnum.MEMBER;
  }
}
