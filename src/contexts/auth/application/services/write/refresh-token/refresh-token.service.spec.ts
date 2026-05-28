import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  const service = new RefreshTokenService();

  describe('hashRefreshToken', () => {
    it('should be deterministic (same input produces same output)', () => {
      const token = 'some-test-token';
      expect(service.hashRefreshToken(token)).toBe(
        service.hashRefreshToken(token),
      );
    });

    it('should produce exactly 64 hex characters', () => {
      const token = 'some-test-token';
      const hash = service.hashRefreshToken(token);
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a base64url string of approximately 43 chars (32 random bytes)', () => {
      const token = service.generateRefreshToken();
      expect(token.length).toBeGreaterThanOrEqual(40);
      expect(token.length).toBeLessThanOrEqual(46);
    });

    it('should produce different values on each call', () => {
      const token1 = service.generateRefreshToken();
      const token2 = service.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });
  });
});
