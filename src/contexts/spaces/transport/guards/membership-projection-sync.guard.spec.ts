import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { sign } from 'crypto';
import { generateKeyPairSync } from 'crypto';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { SpaceMembershipBuilder } from '@contexts/spaces/domain/builders/space-membership.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SisquesAccountConfig } from '@core/config/sisques-account.config';

import { MembershipProjectionSyncGuard } from './membership-projection-sync.guard';
import { SyncSpaceMembershipProjectionCommand } from '../../application/commands/sync-space-membership-projection/sync-space-membership-projection.command';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

function base64url(input: Buffer): string {
  return input.toString('base64url');
}

function buildPlatformToken(): string {
  // RS256 header — same disjoint-algorithm signal the PR3 decorator relies
  // on. Signature validity is irrelevant here: JwtAuthGuard already verified
  // the token before this guard runs; only the header `alg` is inspected.
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { sub: 'platform-subject' };
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

function buildNativeToken(): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { userId: USER_ID };
  return `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(
    Buffer.from(JSON.stringify(payload)),
  )}.signature`;
}

function buildMembership(syncedAt: Date | null): SpaceMembership {
  return new SpaceMembershipBuilder()
    .withUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withRole(MembershipRoleEnum.MEMBER)
    .withJoinedAt(new Date('2024-01-01T00:00:00.000Z'))
    .withSyncedAt(syncedAt)
    .build();
}

function buildMockContext(overrides: {
  authorization?: string;
  user?: Record<string, unknown> | null;
  spaceId?: string;
}): ExecutionContext {
  const headers: Record<string, unknown> = {};
  if (overrides.authorization)
    headers['authorization'] = overrides.authorization;
  if (overrides.spaceId !== undefined)
    headers['x-space-id'] = overrides.spaceId;

  const req: Record<string, unknown> = { headers };
  if (overrides.user !== null) {
    req['user'] = overrides.user ?? { userId: USER_ID, email: 'test@test.com' };
  }

  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('MembershipProjectionSyncGuard', () => {
  let guard: MembershipProjectionSyncGuard;
  let reflector: jest.Mocked<Reflector>;
  let queryBus: jest.Mocked<QueryBus>;
  let commandBus: jest.Mocked<CommandBus>;
  let config: SisquesAccountConfig;

  beforeEach(() => {
    jest.clearAllMocks();

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;

    config = {
      authEnabled: true,
      issuer: 'https://issuer.example',
      jwksUrl: 'https://issuer.example/.well-known/jwks.json',
      audience: 'gardenia',
      apiUrl: 'https://api.sisques-account.example',
      appId: 'gardenia-app-id',
      spaceTenantSyncEnabled: true,
      membershipSyncTtlSeconds: 60,
    };

    guard = new MembershipProjectionSyncGuard(
      reflector,
      queryBus,
      commandBus,
      config,
    );
  });

  describe('@SkipSpace()/@IdentityOnly() bypass', () => {
    it('no-ops when the route is marked skip-space', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('P2 rollback flag', () => {
    it('no-ops unconditionally when SISQUES_SPACE_TENANT_SYNC_ENABLED is false', async () => {
      config.spaceTenantSyncEnabled = false;
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('native (non-platform) principal', () => {
    it('no-ops for a request authenticated with a native HS256 token', async () => {
      const ctx = buildMockContext({
        authorization: `Bearer ${buildNativeToken()}`,
        spaceId: SPACE_ID,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('no-ops when no Authorization header is present at all', async () => {
      const ctx = buildMockContext({ spaceId: SPACE_ID });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('missing prerequisites for a platform-issued request', () => {
    it('no-ops when req.user is absent (let downstream auth handle it)', async () => {
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
        user: null,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });

    it('no-ops when X-Space-ID is missing (let SpaceGuard produce the 400)', async () => {
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('fresh row (within TTL)', () => {
    it('no-ops without dispatching a sync command', async () => {
      queryBus.execute.mockResolvedValue(buildMembership(new Date()));
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('missing row', () => {
    it('dispatches a sync command relaying the raw platform token', async () => {
      queryBus.execute.mockResolvedValue(null);
      commandBus.execute.mockResolvedValue(true);
      const token = buildPlatformToken();
      const ctx = buildMockContext({
        authorization: `Bearer ${token}`,
        spaceId: SPACE_ID,
      });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(SyncSpaceMembershipProjectionCommand),
      );
      const dispatched = commandBus.execute.mock
        .calls[0][0] as SyncSpaceMembershipProjectionCommand;
      expect(dispatched.tenantId.value).toBe(SPACE_ID);
      expect(dispatched.userId.value).toBe(USER_ID);
      expect(dispatched.callerAccessToken).toBe(token);
    });
  });

  describe('stale row (older than syncedAt + TTL)', () => {
    it('dispatches a sync command', async () => {
      const staleDate = new Date(Date.now() - 61_000);
      queryBus.execute.mockResolvedValue(buildMembership(staleDate));
      commandBus.execute.mockResolvedValue(true);
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      await guard.canActivate(ctx);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });

    it('a row exactly at the TTL boundary minus a margin stays fresh (no dispatch)', async () => {
      const freshDate = new Date(Date.now() - 1_000);
      queryBus.execute.mockResolvedValue(buildMembership(freshDate));
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      await guard.canActivate(ctx);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('row with syncedAt null (never synced)', () => {
    it('is always treated as stale and dispatches a sync command', async () => {
      queryBus.execute.mockResolvedValue(buildMembership(null));
      commandBus.execute.mockResolvedValue(true);
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      await guard.canActivate(ctx);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('sync outcome denies access', () => {
    it('throws ForbiddenException when the sync command resolves false', async () => {
      queryBus.execute.mockResolvedValue(null);
      commandBus.execute.mockResolvedValue(false);
      const ctx = buildMockContext({
        authorization: `Bearer ${buildPlatformToken()}`,
        spaceId: SPACE_ID,
      });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });
});
