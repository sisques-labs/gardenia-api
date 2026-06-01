import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';

import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { ChangePasswordCommand } from '@contexts/auth/application/commands/change-password/change-password.command';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { LogoutAllCommand } from '@contexts/auth/application/commands/logout-all/logout-all.command';
import { LogoutCommand } from '@contexts/auth/application/commands/logout/logout.command';
import { RefreshTokenCommand } from '@contexts/auth/application/commands/refresh-token/refresh-token.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { AccountRestMapper } from '@contexts/auth/transport/rest/mappers/account/account.mapper';
import { AccountRestResponseDto } from '@contexts/auth/transport/rest/dtos/account-rest-response.dto';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '@contexts/auth/transport/shared/cookie.helper';

import { IdentityOnly } from '../../../../../shared/decorators/identity-only.decorator';
import { SkipSpace } from '../../../../../shared/decorators/skip-space.decorator';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { LoginUserDto } from '../dtos/login-user.dto';
import { RegisterAccountDto } from '../dtos/register-account.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly accountRestMapper: AccountRestMapper,
  ) {}

  @Get('me')
  @IdentityOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the authenticated account' })
  @ApiResponse({
    status: 200,
    description: 'Returns the authenticated account',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async me(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<AccountRestResponseDto> {
    const result = await this.queryBus.execute<
      AccountFindByCriteriaQuery,
      PaginatedResult<AccountViewModel>
    >(
      new AccountFindByCriteriaQuery({
        criteria: new Criteria([
          {
            field: 'userId',
            operator: FilterOperator.EQUALS,
            value: user.userId,
          },
        ]),
      }),
    );
    const account = result.items[0];
    if (!account) throw new AccountNotFoundException(user.userId);
    return this.accountRestMapper.toViewModel(account);
  }

  @Post('register')
  @SkipSpace()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account' })
  @ApiResponse({ status: 201, description: 'Account registered successfully' })
  @ApiResponse({ status: 409, description: 'Account already exists' })
  async register(
    @Body() dto: RegisterAccountDto,
  ): Promise<{ spaceId: string }> {
    return this.commandBus.execute(
      new RegisterAccountCommand({ email: dto.email, password: dto.password }),
    );
  }

  @Post('login')
  @SkipSpace()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const result = await this.commandBus.execute<
      LoginAccountCommand,
      { accessToken: string; refreshToken: string }
    >(new LoginAccountCommand({ email: dto.email, password: dto.password }));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  @SkipSpace()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiResponse({ status: 200, description: 'Returns new JWT access token' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (!refreshToken) throw new UnauthorizedException();
    const result = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand({ refreshToken }));
    setRefreshCookie(res, result.refreshToken);
    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @SkipSpace()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and revoke refresh token cookie' })
  @ApiResponse({ status: 204, description: 'Logged out successfully' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (refreshToken) {
      await this.commandBus.execute(new LogoutCommand({ refreshToken }));
    }
    clearRefreshCookie(res);
  }

  @Post('logout-all')
  @IdentityOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout from all sessions' })
  @ApiResponse({ status: 204, description: 'All sessions revoked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logoutAll(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.commandBus.execute(
      new LogoutAllCommand({ userId: user.userId }),
    );
    clearRefreshCookie(res);
  }

  @Patch('password')
  @IdentityOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
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
      new ChangePasswordCommand({
        userId: user.userId,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      }),
    );
  }

  @Delete('account')
  @IdentityOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete the authenticated account' })
  @ApiResponse({ status: 204, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser() user: CurrentUserPayload): Promise<void> {
    await this.commandBus.execute(new DeleteAccountCommand(user.userId));
  }
}
