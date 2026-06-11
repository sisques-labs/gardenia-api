import { JwtService } from '@nestjs/jwt';

import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    service = new TokenService(jwtService);
  });

  describe('sign()', () => {
    it('should call jwtService.sign with sub, email and role claims', () => {
      jwtService.sign.mockReturnValue('signed-token');

      const result = service.sign('user-id-123', 'user@example.com', 'admin');

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id-123',
        email: 'user@example.com',
        role: 'admin',
      });
      expect(result).toBe('signed-token');
    });

    it('should include the role claim in the payload for user role', () => {
      jwtService.sign.mockReturnValue('user-token');

      service.sign('user-id-456', 'other@example.com', 'user');

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' }),
      );
    });
  });
});
