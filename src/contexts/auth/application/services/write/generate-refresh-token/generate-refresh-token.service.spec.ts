import { GenerateRefreshTokenService } from './generate-refresh-token.service';

describe('GenerateRefreshTokenService', () => {
  const service = new GenerateRefreshTokenService();

  it('should return a base64url string of approximately 43 chars (32 random bytes)', async () => {
    const token = await service.execute();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token.length).toBeLessThanOrEqual(46);
  });

  it('should produce different values on each call', async () => {
    const token1 = await service.execute();
    const token2 = await service.execute();
    expect(token1).not.toBe(token2);
  });
});
