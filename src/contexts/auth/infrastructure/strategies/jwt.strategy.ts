import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('auth.jwtSecret') ??
        (process.env.JWT_SECRET as string),
    });
  }

  validate(payload: { sub: string; email: string; role?: string }): {
    userId: string;
    email: string;
    appRole: AppRoleEnum;
  } {
    return {
      userId: payload.sub,
      email: payload.email,
      appRole: (payload.role as AppRoleEnum) ?? AppRoleEnum.USER,
    };
  }
}
