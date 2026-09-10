import { extractPlatformAccessToken } from './platform-access-token.decorator';

function fakeJwt(header: Record<string, unknown>): string {
  const encode = (obj: Record<string, unknown>): string =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode(header)}.${encode({ sub: 'irrelevant' })}.signature`;
}

describe('extractPlatformAccessToken', () => {
  it('returns the raw token when the Authorization header carries an RS256 (platform) JWT', () => {
    const token = fakeJwt({ alg: 'RS256', kid: 'platform-key-1' });

    const result = extractPlatformAccessToken(`Bearer ${token}`);

    expect(result).toBe(token);
  });

  it('returns a DIFFERENT raw token for a DIFFERENT RS256 JWT (triangulation)', () => {
    const token = fakeJwt({ alg: 'RS256', kid: 'platform-key-2' });

    const result = extractPlatformAccessToken(`Bearer ${token}`);

    expect(result).toBe(token);
    expect(result).not.toBe(fakeJwt({ alg: 'RS256', kid: 'platform-key-1' }));
  });

  it('returns null for an HS256 (native gardenia) JWT — D2 disjoint-algorithm invariant', () => {
    const token = fakeJwt({ alg: 'HS256' });

    const result = extractPlatformAccessToken(`Bearer ${token}`);

    expect(result).toBeNull();
  });

  it('returns null when there is no Authorization header', () => {
    expect(extractPlatformAccessToken(undefined)).toBeNull();
  });

  it('returns null when the header is not a Bearer scheme', () => {
    expect(extractPlatformAccessToken('Basic dXNlcjpwYXNz')).toBeNull();
  });

  it('returns null for a malformed token that cannot be decoded', () => {
    expect(extractPlatformAccessToken('Bearer not-a-jwt')).toBeNull();
  });
});
