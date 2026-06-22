import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

describe('OptionalJwtAuthGuard', () => {
  let guard: OptionalJwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new OptionalJwtAuthGuard(reflector);
  });

  describe('canActivate()', () => {
    it('allows the request without JWT validation when @SkipSpace() is set', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('delegates to JWT validation when @SkipSpace() is not set', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      const superCanActivate = jest
        .spyOn(
          Object.getPrototypeOf(Object.getPrototypeOf(guard)),
          'canActivate',
        )
        .mockResolvedValue(true as never);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(superCanActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('handleRequest()', () => {
    it('returns the user when authentication succeeds', () => {
      const user = { userId: 'u1' };

      expect(guard.handleRequest(null, user, undefined)).toBe(user);
    });

    it('rethrows the error when one is present', () => {
      const error = new Error('boom');

      expect(() => guard.handleRequest(error, null, undefined)).toThrow('boom');
    });

    it('throws UnauthorizedException with the info message when there is no user', () => {
      expect(() =>
        guard.handleRequest(null, null, { message: 'expired' }),
      ).toThrow(UnauthorizedException);
    });

    it('throws a default UnauthorizedException when no info is provided', () => {
      expect(() => guard.handleRequest(null, null, undefined)).toThrow(
        'Unauthorized',
      );
    });
  });
});
