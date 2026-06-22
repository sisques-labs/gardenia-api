import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  describe('getRequest()', () => {
    it('returns the HTTP request for REST contexts', () => {
      const req = { headers: {} };
      const context = {
        getType: () => 'http',
        switchToHttp: () => ({ getRequest: () => req }),
      } as unknown as ExecutionContext;

      expect(guard.getRequest(context)).toBe(req);
    });

    it('returns the underlying request from the GraphQL context', () => {
      const req = { headers: {} };
      const context = {
        getType: () => 'graphql',
      } as unknown as ExecutionContext;
      jest
        .spyOn(GqlExecutionContext, 'create')
        .mockReturnValue({ getContext: () => ({ req }) } as never);

      expect(guard.getRequest(context)).toBe(req);
    });
  });
});
