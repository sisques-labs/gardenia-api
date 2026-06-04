import { OAuthProviderValueObject } from './oauth-provider.vo';

describe('OAuthProviderValueObject', () => {
  it('should accept valid providers', () => {
    expect(() => new OAuthProviderValueObject('google')).not.toThrow();
    expect(() => new OAuthProviderValueObject('github')).not.toThrow();
    expect(() => new OAuthProviderValueObject('apple')).not.toThrow();
  });

  it('should expose the value', () => {
    const vo = new OAuthProviderValueObject('google');
    expect(vo.value).toBe('google');
  });

  it('should throw for invalid provider', () => {
    expect(() => new OAuthProviderValueObject('facebook')).toThrow();
  });
});
