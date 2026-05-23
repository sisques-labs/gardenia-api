import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { LoginUserCommand } from '@contexts/auth/application/commands/login-user/login-user.command';
import { AuthPayload } from '@contexts/auth/application/commands/login-user/login-user.handler';
import { CurrentUser, CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { LocalAuthGuard } from '@contexts/auth/infrastructure/guards/local-auth.guard';

import { LoginUserDto } from './dtos/login-user.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() _dto: LoginUserDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ accessToken: string }> {
    const result = await this.commandBus.execute<LoginUserCommand, AuthPayload>(
      new LoginUserCommand(user.userId, user.email),
    );
    return { accessToken: result.accessToken };
  }
}
