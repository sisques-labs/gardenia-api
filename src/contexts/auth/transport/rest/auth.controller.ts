import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
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

import { ChangePasswordCommand } from '@contexts/auth/application/commands/change-password/change-password.command';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';

import { ChangePasswordDto } from './dtos/change-password.dto';
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
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginUserDto): Promise<{ accessToken: string }> {
    return this.commandBus.execute<
      LoginAccountCommand,
      { accessToken: string }
    >(new LoginAccountCommand({ email: dto.email, password: dto.password }));
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Change the authenticated account password' })
  @ApiResponse({ status: 204, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or unauthorized',
  })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangePasswordCommand(
        user.userId,
        dto.currentPassword,
        dto.newPassword,
      ),
    );
  }

  @Delete('account')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete the authenticated account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: CurrentUserPayload): Promise<void> {
    await this.commandBus.execute(new DeleteAccountCommand(user.userId));
  }
}
