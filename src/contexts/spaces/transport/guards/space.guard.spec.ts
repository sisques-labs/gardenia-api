// ALS Decision: SpaceContext is set by SpaceInterceptor (not this guard).
// Guards resolve before the handler executes; ALS run() in a guard closes
// before the handler chain completes. SpaceInterceptor wraps next.handle()
// ensuring the ALS frame covers the full request lifecycle.

import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QueryBus } from '@nestjs/cqrs';

import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SKIP_SPACE_KEY } from '../../../../shared/decorators/skip-space.decorator';

import { SpaceGuard } from './space.guard';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

function buildMockContext(overrides: {
  user?: { userId: string; email: string } | null;
  spaceId?: string | undefined;
  type?: string;
}): ExecutionContext {
  const req: Record<string, unknown> = {
    headers: {} as Record<string, unknown>,
  };

  if (overrides.user !== null) {
    req['user'] = overrides.user ?? { userId: USER_ID, email: 'test@test.com' };
  }

  if (overrides.spaceId !== undefined) {
    (req['headers'] as Record<string, unknown>)['x-space-id'] =
      overrides.spaceId;
  }

  const contextType = overrides.type ?? 'http';

  return {
    getType: () => contextType,
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

describe('SpaceGuard', () => {
  let guard: SpaceGuard;
  let reflector: jest.Mocked<Reflector>;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    guard = new SpaceGuard(reflector, queryBus);
  });

  describe('@SkipSpace() bypass', () => {
    it('should return true immediately when SKIP_SPACE_KEY is set on handler', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = buildMockContext({ user: null, spaceId: undefined });

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(queryBus.execute).not.toHaveBeenCalled();
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(SKIP_SPACE_KEY, [
        {},
        {},
      ]);
    });
  });

  describe('missing JWT user', () => {
    it('should throw UnauthorizedException when req.user is absent', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = buildMockContext({ user: null, spaceId: SPACE_ID });

      await expect(guard.canActivate(ctx)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('missing x-space-id header', () => {
    it('should throw BadRequestException when x-space-id header is absent', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = buildMockContext({ spaceId: undefined });

      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when x-space-id header is empty string', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const ctx = buildMockContext({ spaceId: '' });

      await expect(guard.canActivate(ctx)).rejects.toThrow(BadRequestException);
    });
  });

  describe('non-member', () => {
    it('should throw ForbiddenException when QueryBus returns null (user not a member)', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      queryBus.execute.mockResolvedValue(null);
      const ctx = buildMockContext({ spaceId: SPACE_ID });

      await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('valid member', () => {
    it('should set req.spaceId and return true when user is a member', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const membership = SpaceMembership.create(
        USER_ID,
        SPACE_ID,
        MembershipRoleEnum.MEMBER,
      );
      queryBus.execute.mockResolvedValue(membership);

      const ctx = buildMockContext({ spaceId: SPACE_ID });
      const req = ctx.switchToHttp().getRequest() as Record<string, unknown>;

      const result = await guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(req['spaceId']).toBe(SPACE_ID);
    });
  });
});
