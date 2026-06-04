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

import {
  LoginWithOAuthCommand,
  LoginWithOAuthCommandInput,
} from '@contexts/auth/application/commands/oauth/login-with-oauth/login-with-oauth.command';
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

  @Get(':provider')
  @SkipSpace()
  @UseGuards(DynamicOAuthGuard)
  @ApiOperation({ summary: 'Initiate OAuth login with a provider' })
  initiate(): void {
    // Intentionally empty — Passport guard performs the redirect.
  }

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
    const profile = req.user as Omit<LoginWithOAuthCommandInput, 'deviceInfo'>;
    const input: LoginWithOAuthCommandInput = {
      ...profile,
      deviceInfo: req.headers['user-agent'],
    };
    const { accessToken, refreshToken } = await this.commandBus.execute<
      LoginWithOAuthCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginWithOAuthCommand(input));
    this.cookies.setRefreshCookie(res, refreshToken);
    res.redirect(
      `${this.frontendUrl}/auth/callback#access_token=${accessToken}`,
    );
  }
}
