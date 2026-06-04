import { OAuthStateMismatchException } from '@contexts/auth/domain/exceptions/oauth-state-mismatch.exception';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { OAuthStateService } from './oauth-state.service';

describe('OAuthStateService', () => {
  let service: OAuthStateService;
  let jwtService: JwtService;

  beforeEach(() => {
    jwtService = new JwtService({});
    const configService = {
      get: jest.fn().mockReturnValue('test-state-secret'),
    } as unknown as ConfigService;

    service = new OAuthStateService(jwtService, configService);
  });

  it('should issue and verify a valid state for the same provider', () => {
    const state = service.issue('google');
    expect(typeof state).toBe('string');
    expect(state.length).toBeGreaterThan(0);

    const payload = service.verify(state, 'google');
    expect(payload.provider).toBe('google');
    expect(typeof payload.nonce).toBe('string');
  });

  it('should throw OAuthStateMismatchException when provider does not match', () => {
    const state = service.issue('google');
    expect(() => service.verify(state, 'github')).toThrow(
      OAuthStateMismatchException,
    );
  });

  it('should throw OAuthStateMismatchException for a tampered state', () => {
    expect(() => service.verify('tampered.jwt.token', 'google')).toThrow(
      OAuthStateMismatchException,
    );
  });

  it('should throw OAuthStateMismatchException for an empty state', () => {
    expect(() => service.verify('', 'google')).toThrow(
      OAuthStateMismatchException,
    );
  });
});
