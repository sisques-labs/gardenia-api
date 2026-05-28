import { HashRefreshTokenService } from './hash-refresh-token.service';

describe('HashRefreshTokenService', () => {
  const service = new HashRefreshTokenService();

  it('should be deterministic (same input produces same output)', async () => {
    const token = 'some-test-token';
    expect(await service.execute(token)).toBe(await service.execute(token));
  });

  it('should produce exactly 64 hex characters', async () => {
    const token = 'some-test-token';
    const hash = await service.execute(token);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
