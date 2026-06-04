import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';

import { LoginWithOAuthCommand } from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';
import { OAuthUserProfile } from '@contexts/auth/application/ports/oauth-user-profile';
import { DynamicOAuthGuard } from '@contexts/auth/infrastructure/guards/dynamic-oauth.guard';
import { RefreshCookieService } from '@contexts/auth/transport/shared/refresh-cookie.service';
import { SkipSpace } from '../../../../../shared/decorators/skip-space.decorator';

@ApiTags('auth-oauth')
@Controller('auth/oauth')
export class OAuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly commandBus: CommandBus,
    private readonly cookies: RefreshCookieService,
    configService: ConfigService,
  ) {
    this.frontendUrl = configService.get<string>('app.frontendUrl') ?? '/';
  }

  /**
   * Step 1: Initiate OAuth flow — redirects browser to the provider.
   * The DynamicOAuthGuard validates the provider name and lets Passport
   * perform the 302 redirect. The handler body never runs.
   */
  @Get(':provider')
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)
  @ApiOperation({ summary: 'Initiate OAuth login with a provider' })
  initiate(): void {
    // Intentionally empty — Passport guard performs the redirect.
  }

  /**
   * Step 2a: OAuth callback (GET) — used by Google and GitHub.
   * Passport's strategy `validate()` is called by the guard, which resolves
   * the OAuthUserProfile and places it on `req.user`.
   */
  @Get(':provider/callback')
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)
  @ApiOperation({ summary: 'OAuth callback (GET) — Google / GitHub' })
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Param('provider') _provider: string,
  ): Promise<void> {
    await this.handleOAuthCallback(req, res);
  }

  /**
   * Step 2b: OAuth callback (POST) — used by Apple (response_mode: form_post).
   * Apple sends the code and user data as an application/x-www-form-urlencoded POST.
   * Express urlencoded body parser must be enabled (see main.ts).
   */
  @Post('apple/callback')
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)
  @ApiOperation({ summary: 'OAuth callback (POST) — Apple form_post' })
  async appleCallback(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.handleOAuthCallback(req, res);
  }

  private async handleOAuthCallback(
    req: Request,
    res: Response,
  ): Promise<void> {
    const profile = req.user as OAuthUserProfile;
    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginWithOAuthCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginWithOAuthCommand(profile, req.headers['user-agent']));
    this.cookies.setRefreshCookie(res, refreshToken);
    res.redirect(
      `${this.frontendUrl}/auth/callback#access_token=${accessToken}`,
    );
  }
}
