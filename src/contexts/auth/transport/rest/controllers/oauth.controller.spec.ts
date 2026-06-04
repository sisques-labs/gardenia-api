import { CommandBus } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { OAuthController } from './oauth.controller';
import { RefreshCookieService } from '@contexts/auth/transport/shared/refresh-cookie.service';
import {
  LoginWithOAuthCommand,
  LoginWithOAuthCommandInput,
} from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';

describe('OAuthController', () => {
  let controller: OAuthController;
  let commandBus: jest.Mocked<CommandBus>;
  let cookies: jest.Mocked<RefreshCookieService>;

  const profile: Omit<LoginWithOAuthCommandInput, 'deviceInfo'> = {
    provider: 'google',
    providerUserId: 'google-123',
    email: 'user@example.com',
    emailVerified: true,
    accessToken: 'at',
    refreshToken: null,
    tokenExpiresAt: null,
  };

  beforeEach(() => {
    commandBus = {
      execute: jest
        .fn()
        .mockResolvedValue({ accessToken: 'jwt-at', refreshToken: 'rt' }),
    } as unknown as jest.Mocked<CommandBus>;

    cookies = {
      setRefreshCookie: jest.fn(),
      clearRefreshCookie: jest.fn(),
      cookieName: 'refresh_token',
    } as unknown as jest.Mocked<RefreshCookieService>;

    const configService = {
      get: jest.fn(
        (key: string) =>
          ({ 'app.frontendUrl': 'https://app.example.com' })[key],
      ),
    } as unknown as ConfigService;

    controller = new OAuthController(commandBus, cookies, configService);
  });

  it('callback dispatches LoginWithOAuthCommand with profile from req.user', async () => {
    const req = { user: profile, headers: { 'user-agent': 'test-ua' } } as any;
    const res = { redirect: jest.fn() } as any;

    await controller.callback(req, res, 'google');

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(LoginWithOAuthCommand),
    );
    const called = (commandBus.execute as jest.Mock).mock
      .calls[0][0] as LoginWithOAuthCommand;
    expect(called.provider.value).toBe('google');
    expect(called.deviceInfo?.value).toBe('test-ua');
  });

  it('callback sets refresh cookie after successful login', async () => {
    const req = { user: profile, headers: { 'user-agent': 'ua' } } as any;
    const res = { redirect: jest.fn() } as any;

    await controller.callback(req, res, 'google');

    expect(cookies.setRefreshCookie).toHaveBeenCalledWith(res, 'rt');
  });

  it('callback redirects to frontendUrl with access_token fragment', async () => {
    const req = { user: profile, headers: { 'user-agent': 'ua' } } as any;
    const res = { redirect: jest.fn() } as any;

    await controller.callback(req, res, 'google');

    expect(res.redirect).toHaveBeenCalledWith(
      'https://app.example.com/auth/callback#access_token=jwt-at',
    );
  });

  it('appleCallback also dispatches LoginWithOAuthCommand', async () => {
    const req = { user: profile, headers: { 'user-agent': 'ua' } } as any;
    const res = { redirect: jest.fn() } as any;

    await controller.appleCallback(req, res);

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(cookies.setRefreshCookie).toHaveBeenCalledWith(res, 'rt');
  });
});
