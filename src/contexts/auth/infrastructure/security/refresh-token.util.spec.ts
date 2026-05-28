import { generateRefreshToken, hashRefreshToken } from './refresh-token.util';

describe('refresh-token.util', () => {
  describe('hashRefreshToken', () => {
    it('should be deterministic (same input produces same output)', () => {
      const token = 'some-test-token';
      expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    });

    it('should produce exactly 64 hex characters', () => {
      const token = 'some-test-token';
      const hash = hashRefreshToken(token);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a base64url string of approximately 43 chars (32 random bytes)', () => {
      const token = generateRefreshToken();
      // base64url of 32 bytes is Math.ceil(32 * 4 / 3) = 43 chars (no padding)
      expect(token.length).toBeGreaterThanOrEqual(40);
      expect(token.length).toBeLessThanOrEqual(46);
    });

    it('should produce different values on each call', () => {
      const token1 = generateRefreshToken();
      const token2 = generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });
});
