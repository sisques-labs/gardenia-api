import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(userId: string, email: string, role: string): string {
    return this.jwtService.sign({ sub: userId, email, role });
  }

  verify(token: string): { sub: string; email: string; role?: string } {
    return this.jwtService.verify<{
      sub: string;
      email: string;
      role?: string;
    }>(token);
  }
}
