import { ConfigService } from '@nestjs/config';

import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;

    strategy = new JwtStrategy(configService);
  });

  describe('validate()', () => {
    it('should return userId, email and appRole when role is present in payload', () => {
      const payload = {
        sub: 'user-id-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id-123',
        email: 'user@example.com',
        appRole: AppRoleEnum.ADMIN,
      });
    });

    it('should default appRole to USER when role is absent from payload', () => {
      const payload = { sub: 'user-id-456', email: 'other@example.com' };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id-456',
        email: 'other@example.com',
        appRole: AppRoleEnum.USER,
      });
    });

    it('should default appRole to USER when role is undefined', () => {
      const payload = {
        sub: 'user-id-789',
        email: 'test@example.com',
        role: undefined,
      };

      const result = strategy.validate(payload);

      expect(result.appRole).toBe(AppRoleEnum.USER);
    });
  });

  describe('tenant-resolution policy lock-in', () => {
    it('should return only userId, email and appRole as keys', () => {
      const payload = {
        sub: 'user-id-123',
        email: 'user@example.com',
        role: 'admin',
      };

      const result = strategy.validate(payload);

      expect(Object.keys(result).sort()).toEqual([
        'appRole',
        'email',
        'userId',
      ]);
    });

    it('should drop extra spaceId/tenants claim fields instead of forwarding them', () => {
      const payload = {
        sub: 'user-id-123',
        email: 'user@example.com',
        spaceId: 'some-space-id',
        tenants: [{ id: 'some-space-id' }],
      } as unknown as { sub: string; email: string; role?: string };

      const result = strategy.validate(payload);

      expect((result as Record<string, unknown>)['spaceId']).toBeUndefined();
      expect((result as Record<string, unknown>)['tenants']).toBeUndefined();
      expect(Object.keys(result).sort()).toEqual([
        'appRole',
        'email',
        'userId',
      ]);
    });
  });
});
