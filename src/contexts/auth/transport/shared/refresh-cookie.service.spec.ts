import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

import { RefreshCookieService } from './refresh-cookie.service';

const buildMockResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  }) as unknown as jest.Mocked<Response>;

function buildService(overrides?: {
  cookieName?: string;
  ttlDays?: number;
  nodeEnv?: string;
}): RefreshCookieService {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'auth.refreshCookieName')
        return overrides?.cookieName ?? 'gardenia_refresh';
      if (key === 'auth.refreshTokenTtlDays') return overrides?.ttlDays ?? 30;
      if (key === 'app.nodeEnv') return overrides?.nodeEnv ?? 'development';
      return undefined;
    }),
  } as unknown as ConfigService;

  return new RefreshCookieService(configService);
}

describe('RefreshCookieService', () => {
  describe('cookieName getter', () => {
    it('returns the cookie name from config', () => {
      const sut = buildService({ cookieName: 'my_refresh' });
      expect(sut.cookieName).toBe('my_refresh');
    });
  });

  describe('setRefreshCookie()', () => {
    it('calls res.cookie with the correct name from config', () => {
      const sut = buildService({ cookieName: 'test_cookie' });
      const res = buildMockResponse();

      sut.setRefreshCookie(res, 'some-token');

      expect(res.cookie).toHaveBeenCalledWith(
        'test_cookie',
        'some-token',
        expect.any(Object),
      );
    });

    it('sets httpOnly, sameSite strict, and path / options', () => {
      const sut = buildService();
      const res = buildMockResponse();

      sut.setRefreshCookie(res, 'some-token');

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
    });

    it('sets secure: false in non-production environment', () => {
      const sut = buildService({ nodeEnv: 'development' });
      const res = buildMockResponse();

      sut.setRefreshCookie(res, 'token');

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.secure).toBe(false);
    });

    it('sets secure: true in production environment', () => {
      const sut = buildService({ nodeEnv: 'production' });
      const res = buildMockResponse();

      sut.setRefreshCookie(res, 'token');

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.secure).toBe(true);
    });

    it('sets maxAge derived from ttlDays config', () => {
      const sut = buildService({ ttlDays: 7 });
      const res = buildMockResponse();

      sut.setRefreshCookie(res, 'token');

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.maxAge).toBe(7 * 86_400_000);
    });
  });

  describe('clearRefreshCookie()', () => {
    it('calls clearCookie with the correct name', () => {
      const sut = buildService({ cookieName: 'my_cookie' });
      const res = buildMockResponse();

      sut.clearRefreshCookie(res);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'my_cookie',
        expect.any(Object),
      );
    });

    it('includes httpOnly, sameSite, path in clear options', () => {
      const sut = buildService();
      const res = buildMockResponse();

      sut.clearRefreshCookie(res);

      const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
    });

    it('does NOT include maxAge in clear options', () => {
      const sut = buildService();
      const res = buildMockResponse();

      sut.clearRefreshCookie(res);

      const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
      expect(options).not.toHaveProperty('maxAge');
    });
  });
});
