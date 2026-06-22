import { BadRequestException, ExecutionContext } from '@nestjs/common';

import { OAuthProviderRegistry } from '../oauth/oauth-provider.registry';
import { DynamicOAuthGuard } from './dynamic-oauth.guard';

const contextWithProvider = (provider: unknown): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ params: { provider } }),
    }),
  }) as unknown as ExecutionContext;

describe('DynamicOAuthGuard', () => {
  let guard: DynamicOAuthGuard;
  let registry: jest.Mocked<OAuthProviderRegistry>;

  beforeEach(() => {
    registry = {
      isKnown: jest.fn(),
      assertKnown: jest.fn(),
    } as unknown as jest.Mocked<OAuthProviderRegistry>;
    guard = new DynamicOAuthGuard(registry);
  });

  it('throws BadRequestException for an unknown provider', async () => {
    registry.isKnown.mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithProvider('myspace')),
    ).rejects.toThrow(BadRequestException);
    expect(registry.assertKnown).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when no provider is present', async () => {
    registry.isKnown.mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithProvider(undefined)),
    ).rejects.toThrow(BadRequestException);
    expect(registry.isKnown).not.toHaveBeenCalled();
  });

  it('checks the first value when the provider param is an array', async () => {
    registry.isKnown.mockReturnValue(false);

    await expect(
      guard.canActivate(contextWithProvider(['github', 'google'])),
    ).rejects.toThrow(BadRequestException);
    expect(registry.isKnown).toHaveBeenCalledWith('github');
  });
});
