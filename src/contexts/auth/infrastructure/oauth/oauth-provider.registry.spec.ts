import { NotFoundException } from '@nestjs/common';
import { OAuthProviderRegistry } from './oauth-provider.registry';

describe('OAuthProviderRegistry', () => {
  let registry: OAuthProviderRegistry;

  beforeEach(() => {
    registry = new OAuthProviderRegistry();
  });

  it.each(['google', 'github', 'apple'] as const)(
    'returns true for known provider "%s"',
    (provider) => {
      expect(registry.isKnown(provider)).toBe(true);
    },
  );

  it('returns false for unknown provider', () => {
    expect(registry.isKnown('facebook')).toBe(false);
  });

  it('assertKnown returns the provider name when known', () => {
    expect(registry.assertKnown('google')).toBe('google');
  });

  it('assertKnown throws NotFoundException for unknown provider', () => {
    expect(() => registry.assertKnown('linkedin')).toThrow(NotFoundException);
  });
});
