import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { ConfigService } from '@nestjs/config';

import { SisquesAccountPrincipalResolver } from '@contexts/auth/infrastructure/services/sisques-account-principal.resolver';
import { SisquesAccountJwtStrategy } from './sisques-account-jwt.strategy';

describe('SisquesAccountJwtStrategy', () => {
  let strategy: SisquesAccountJwtStrategy;
  let principalResolver: jest.Mocked<SisquesAccountPrincipalResolver>;

  beforeEach(() => {
    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          'sisquesAccount.jwksUrl':
            'https://account.sisques.com/.well-known/jwks.json',
          'sisquesAccount.issuer': 'https://account.sisques.com',
          'sisquesAccount.audience': 'gardenia',
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    principalResolver = {
      resolve: jest.fn(),
    } as unknown as jest.Mocked<SisquesAccountPrincipalResolver>;

    strategy = new SisquesAccountJwtStrategy(configService, principalResolver);
  });

  describe('validate()', () => {
    it('resolves the principal via the account-projection lookup and returns userId/email/appRole', async () => {
      principalResolver.resolve.mockResolvedValue({
        userId: 'local-user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.ADMIN,
      });

      const payload = {
        sub: 'platform-subject-abc',
        email: 'user@example.com',
        platformAdmin: true,
        tenants: [{ tenantId: 'tenant-1', role: 'owner' }],
      };

      const result = await strategy.validate(payload);

      expect(principalResolver.resolve).toHaveBeenCalledWith({
        externalSubject: 'platform-subject-abc',
        email: 'user@example.com',
      });
      expect(result).toEqual({
        userId: 'local-user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.ADMIN,
      });
    });

    it('resolves a different appRole for a different account (triangulation)', async () => {
      principalResolver.resolve.mockResolvedValue({
        userId: 'local-user-id-456',
        email: 'other@example.com',
        appRole: AppRoleEnum.USER,
      });

      const result = await strategy.validate({
        sub: 'platform-subject-def',
        email: 'other@example.com',
      });

      expect(result.appRole).toBe(AppRoleEnum.USER);
      expect(result.userId).toBe('local-user-id-456');
    });
  });

  describe('tenant-resolution policy lock-in', () => {
    it('should return only userId, email and appRole as keys', async () => {
      principalResolver.resolve.mockResolvedValue({
        userId: 'local-user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.USER,
      });

      const result = await strategy.validate({
        sub: 'platform-subject-abc',
        email: 'user@example.com',
      });

      expect(Object.keys(result).sort()).toEqual([
        'appRole',
        'email',
        'userId',
      ]);
    });

    it('should drop platformAdmin and tenants[] instead of forwarding them', async () => {
      principalResolver.resolve.mockResolvedValue({
        userId: 'local-user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.USER,
      });

      const result = await strategy.validate({
        sub: 'platform-subject-abc',
        email: 'user@example.com',
        platformAdmin: true,
        tenants: [{ tenantId: 'some-tenant-id', role: 'owner' }],
      });

      expect(
        (result as Record<string, unknown>)['platformAdmin'],
      ).toBeUndefined();
      expect((result as Record<string, unknown>)['tenants']).toBeUndefined();
      expect(Object.keys(result).sort()).toEqual([
        'appRole',
        'email',
        'userId',
      ]);
    });

    it('should never use the platform sub claim as the local userId', async () => {
      principalResolver.resolve.mockResolvedValue({
        userId: 'local-user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.USER,
      });

      const result = await strategy.validate({
        sub: 'platform-subject-abc',
        email: 'user@example.com',
      });

      expect(result.userId).not.toBe('platform-subject-abc');
      expect(result.userId).toBe('local-user-id-123');
    });
  });
});
