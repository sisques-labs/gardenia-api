import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceMembershipBuilder } from '@contexts/spaces/domain/builders/space-membership.builder';
import { TenantMembershipQueryUnavailableException } from '@contexts/spaces/domain/exceptions/tenant-membership-query-unavailable.exception';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { IMembershipWriteRepository } from '@contexts/spaces/domain/repositories/write/membership-write.repository';
import { ITenantMembershipQueryPort } from '@contexts/spaces/application/ports/tenant-membership-query.port';

import { SyncSpaceMembershipProjectionCommand } from './sync-space-membership-projection.command';
import { SyncSpaceMembershipProjectionCommandHandler } from './sync-space-membership-projection.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const TOKEN = 'caller-raw-token';

function buildExistingMembership(): SpaceMembership {
  return new SpaceMembershipBuilder()
    .withUserId(USER_ID)
    .withSpaceId(TENANT_ID)
    .withRole(MembershipRoleEnum.MEMBER)
    .withJoinedAt(new Date('2024-01-01T00:00:00.000Z'))
    .withSyncedAt(new Date('2024-01-01T00:00:00.000Z'))
    .build();
}

describe('SyncSpaceMembershipProjectionCommandHandler', () => {
  let handler: SyncSpaceMembershipProjectionCommandHandler;
  let tenantMembershipQueryPort: jest.Mocked<ITenantMembershipQueryPort>;
  let membershipReadRepository: jest.Mocked<IMembershipReadRepository>;
  let membershipWriteRepository: jest.Mocked<IMembershipWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    tenantMembershipQueryPort = {
      listMembers: jest.fn(),
    } as jest.Mocked<ITenantMembershipQueryPort>;

    membershipReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      countByOwner: jest.fn(),
    } as jest.Mocked<IMembershipReadRepository>;

    membershipWriteRepository = {
      upsert: jest.fn(),
      deleteByUserAndSpace: jest.fn(),
    } as jest.Mocked<IMembershipWriteRepository>;

    handler = new SyncSpaceMembershipProjectionCommandHandler(
      tenantMembershipQueryPort,
      membershipReadRepository,
      membershipWriteRepository,
    );
  });

  const command = () =>
    new SyncSpaceMembershipProjectionCommand({
      tenantId: TENANT_ID,
      userId: USER_ID,
      callerAccessToken: TOKEN,
    });

  describe('200, caller present', () => {
    it('upserts the row with the platform-confirmed role and allows access', async () => {
      tenantMembershipQueryPort.listMembers.mockResolvedValue([
        { userId: USER_ID, role: 'owner' },
      ]);

      const allowed = await handler.execute(command());

      expect(allowed).toBe(true);
      expect(membershipWriteRepository.upsert).toHaveBeenCalledWith(
        USER_ID,
        TENANT_ID,
        MembershipRoleEnum.OWNER,
        expect.any(Date),
      );
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).not.toHaveBeenCalled();
    });

    it('relays the caller access token to the port, never a derived value', async () => {
      tenantMembershipQueryPort.listMembers.mockResolvedValue([
        { userId: USER_ID, role: 'member' },
      ]);

      await handler.execute(command());

      expect(tenantMembershipQueryPort.listMembers).toHaveBeenCalledWith(
        TENANT_ID,
        TOKEN,
      );
    });
  });

  describe('200, caller absent from the returned member list', () => {
    it('deletes the local row and denies access (fail-closed, same as an explicit 403)', async () => {
      tenantMembershipQueryPort.listMembers.mockResolvedValue([
        { userId: 'someone-else', role: 'member' },
      ]);

      const allowed = await handler.execute(command());

      expect(allowed).toBe(false);
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(membershipWriteRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('403 (platform confirms revocation)', () => {
    it('deletes the caller row and denies access', async () => {
      tenantMembershipQueryPort.listMembers.mockResolvedValue(null);

      const allowed = await handler.execute(command());

      expect(allowed).toBe(false);
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).toHaveBeenCalledWith(USER_ID, TENANT_ID);
      expect(membershipWriteRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe('5xx/timeout, existing row present', () => {
    it('leaves the row untouched and allows access, bounded by TTL staleness', async () => {
      tenantMembershipQueryPort.listMembers.mockRejectedValue(
        new TenantMembershipQueryUnavailableException('HTTP 503'),
      );
      membershipReadRepository.findByCriteria.mockResolvedValue(
        new PaginatedResult([buildExistingMembership()], 1, 1, 10),
      );

      const allowed = await handler.execute(command());

      expect(allowed).toBe(true);
      expect(membershipWriteRepository.upsert).not.toHaveBeenCalled();
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).not.toHaveBeenCalled();
    });
  });

  describe('5xx/timeout, no existing row', () => {
    it('writes nothing and fails closed (denies access)', async () => {
      tenantMembershipQueryPort.listMembers.mockRejectedValue(
        new TenantMembershipQueryUnavailableException('ECONNABORTED'),
      );
      membershipReadRepository.findByCriteria.mockResolvedValue(
        new PaginatedResult([], 0, 1, 10),
      );

      const allowed = await handler.execute(command());

      expect(allowed).toBe(false);
      expect(membershipWriteRepository.upsert).not.toHaveBeenCalled();
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).not.toHaveBeenCalled();
    });
  });

  describe('unexpected error', () => {
    it('propagates errors that are not TenantMembershipQueryUnavailableException', async () => {
      tenantMembershipQueryPort.listMembers.mockRejectedValue(
        new Error('boom'),
      );

      await expect(handler.execute(command())).rejects.toThrow('boom');
      expect(membershipWriteRepository.upsert).not.toHaveBeenCalled();
      expect(
        membershipWriteRepository.deleteByUserAndSpace,
      ).not.toHaveBeenCalled();
    });
  });

  it('uses a Criteria lookup scoped to (userId, spaceId) when checking for an existing row', async () => {
    tenantMembershipQueryPort.listMembers.mockRejectedValue(
      new TenantMembershipQueryUnavailableException('HTTP 500'),
    );
    membershipReadRepository.findByCriteria.mockResolvedValue(
      new PaginatedResult([], 0, 1, 10),
    );

    await handler.execute(command());

    expect(membershipReadRepository.findByCriteria).toHaveBeenCalledWith(
      expect.any(Criteria),
    );
  });
});
