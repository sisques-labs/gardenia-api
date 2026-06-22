import { AuthService } from '../../application/services/auth.service';
import { InvalidCredentialsException } from '../../domain/exceptions/invalid-credentials.exception';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    authService = {
      validateAccount: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    strategy = new LocalStrategy(authService);
  });

  describe('validate()', () => {
    it('returns the userId and email when credentials are valid', async () => {
      authService.validateAccount.mockResolvedValue({
        userId: 'u1',
        email: 'user@example.com',
      } as never);

      const result = await strategy.validate('user@example.com', 'secret');

      expect(authService.validateAccount).toHaveBeenCalledWith(
        'user@example.com',
        'secret',
      );
      expect(result).toEqual({ userId: 'u1', email: 'user@example.com' });
    });

    it('throws InvalidCredentialsException when the account cannot be validated', async () => {
      authService.validateAccount.mockResolvedValue(null as never);

      await expect(
        strategy.validate('user@example.com', 'wrong'),
      ).rejects.toThrow(InvalidCredentialsException);
    });
  });
});
