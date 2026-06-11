import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { APP_ROLE_KEY } from '@shared/decorators/require-app-role.decorator';

import { AppRoleGuard } from './app-role.guard';

function buildHttpContext(overrides: {
  user?: { appRole?: AppRoleEnum } | null;
}): ExecutionContext {
  const req: Record<string, unknown> = {};

  if (overrides.user !== null) {
    req['user'] = overrides.user ?? { appRole: AppRoleEnum.USER };
  }

  return {
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function buildGqlContext(overrides: {
  user?: { appRole?: AppRoleEnum } | null;
}): ExecutionContext {
  const req: Record<string, unknown> = {};

  if (overrides.user !== null) {
    req['user'] = overrides.user ?? { appRole: AppRoleEnum.USER };
  }

  return {
    getType: () => 'graphql',
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => ({}),
    getClass: () => ({}),
    getArgs: () => [{}, {}, { req }, {}],
  } as unknown as ExecutionContext;
}

describe('AppRoleGuard', () => {
  let guard: AppRoleGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    jest.clearAllMocks();

    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new AppRoleGuard(reflector);
  });

  describe('no @RequireAppRole metadata', () => {
    it('should pass through for HTTP context when no metadata is present', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = buildHttpContext({ user: null });

      expect(guard.canActivate(ctx)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(APP_ROLE_KEY, [
        {},
        {},
      ]);
    });

    it('should pass through for GraphQL context when no metadata is present', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const ctx = buildGqlContext({ user: null });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });

  describe('no authenticated user', () => {
    it('should throw UnauthorizedException for HTTP context when req.user is absent', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildHttpContext({ user: null });

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for GraphQL context when req.user is absent', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildGqlContext({ user: null });

      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });

  describe('role mismatch', () => {
    it('should throw ForbiddenException for HTTP when user role is not in required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildHttpContext({ user: { appRole: AppRoleEnum.USER } });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException for GraphQL when user role is not in required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildGqlContext({ user: { appRole: AppRoleEnum.USER } });

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });
  });

  describe('role match', () => {
    it('should return true for HTTP when user role matches required role', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildHttpContext({ user: { appRole: AppRoleEnum.ADMIN } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should return true for GraphQL when user role matches required role', () => {
      reflector.getAllAndOverride.mockReturnValue([AppRoleEnum.ADMIN]);
      const ctx = buildGqlContext({ user: { appRole: AppRoleEnum.ADMIN } });

      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('should return true when user is USER and USER is in required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([
        AppRoleEnum.ADMIN,
        AppRoleEnum.USER,
      ]);
      const ctx = buildHttpContext({ user: { appRole: AppRoleEnum.USER } });

      expect(guard.canActivate(ctx)).toBe(true);
    });
  });
});
