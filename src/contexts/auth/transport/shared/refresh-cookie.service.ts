import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class RefreshCookieService {
  private readonly name: string;
  private readonly ttlMs: number;
  private readonly secure: boolean;

  constructor(private readonly config: ConfigService) {
    this.name = this.config.get<string>('auth.refreshCookieName')!;
    this.ttlMs =
      this.config.get<number>('auth.refreshTokenTtlDays')! * 86_400_000;
    this.secure = this.config.get<string>('app.nodeEnv') === 'production';
  }

  private options(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: 'strict',
      path: '/',
      maxAge: this.ttlMs,
    };
  }

  setRefreshCookie(res: Response, token: string): void {
    res.cookie(this.name, token, this.options());
  }

  clearRefreshCookie(res: Response): void {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { maxAge: _maxAge, ...clearOptions } = this.options();
    res.clearCookie(this.name, clearOptions);
  }

  get cookieName(): string {
    return this.name;
  }
}
