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
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { CurrentUser, CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { LocalAuthGuard } from '@contexts/auth/infrastructure/guards/local-auth.guard';

import { LoginUserDto } from './dtos/login-user.dto';
import { RegisterAccountDto } from './dtos/register-account.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account registered successfully' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async register(@Body() dto: RegisterAccountDto): Promise<void> {
    await this.commandBus.execute(
      new RegisterAccountCommand({ email: dto.email, password: dto.password }),
    );
  }

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
    const result = await this.commandBus.execute<LoginUserCommand, { accessToken: string }>(
      new LoginUserCommand({ userId: user.userId, email: user.email }),
    );
    return { accessToken: result.accessToken };
  }
}
