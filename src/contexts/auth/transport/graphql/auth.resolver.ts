import { ChangePasswordCommand } from '@contexts/auth/application/commands/change-password/change-password.command';
import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { LogoutAllCommand } from '@contexts/auth/application/commands/logout-all/logout-all.command';
import { LogoutCommand } from '@contexts/auth/application/commands/logout/logout.command';
import { RefreshTokenCommand } from '@contexts/auth/application/commands/refresh-token/refresh-token.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '@contexts/auth/transport/shared/cookie.helper';
import { UnauthorizedException, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  Criteria,
  FilterOperator,
  MutationResponseDto,
  MutationResponseGraphQLMapper,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountGraphQLMapper } from './mappers/account/account.mapper';
import { AccountObject } from './objects/account.object';

import { ChangePasswordInput } from './dtos/change-password.input';
import { LoginUserInput } from './dtos/login-user.input';
import { RegisterAccountInput } from './dtos/register-account.input';
import { AuthPayloadObject } from './objects/auth-payload.object';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly accountGraphQLMapper: AccountGraphQLMapper,
  ) {}

  @Query(() => AccountObject)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: CurrentUserPayload): Promise<AccountObject> {
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
    return this.accountGraphQLMapper.toAccountObject(account);
  }

  @Mutation(() => Boolean)
  async register(@Args('input') input: RegisterAccountInput): Promise<boolean> {
    await this.commandBus.execute(
      new RegisterAccountCommand({
        email: input.email,
        password: input.password,
      }),
    );
    return true;
  }

  @Mutation(() => AuthPayloadObject)
  async login(
    @Args('input') input: LoginUserInput,
    @Context() ctx: any,
  ): Promise<AuthPayloadObject> {
    const result = await this.commandBus.execute<
      LoginAccountCommand,
      { accessToken: string; refreshToken: string }
    >(
      new LoginAccountCommand({ email: input.email, password: input.password }),
    );

    setRefreshCookie(ctx.req.res, result.refreshToken);

    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = result.accessToken;
    return authPayload;
  }

  @Mutation(() => AuthPayloadObject)
  async refreshToken(@Context() ctx: any): Promise<AuthPayloadObject> {
    const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    if (!refreshToken) {
      throw new UnauthorizedException();
    }
    const result = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(
      new RefreshTokenCommand({
        refreshToken,
      }),
    );

    setRefreshCookie(ctx.req.res, result.refreshToken);

    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = result.accessToken;
    return authPayload;
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: any): Promise<boolean> {
    const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    if (refreshToken) {
      await this.commandBus.execute(
        new LogoutCommand({
          refreshToken,
        }),
      );
    }
    clearRefreshCookie(ctx.req.res);
    return true;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  async logoutAll(
    @CurrentUser() user: CurrentUserPayload,
    @Context() ctx: any,
  ): Promise<boolean> {
    await this.commandBus.execute(
      new LogoutAllCommand({
        userId: user.userId,
      }),
    );
    clearRefreshCookie(ctx.req.res);
    return true;
  }
  @Mutation(() => MutationResponseDto)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    await this.commandBus.execute(
      new ChangePasswordCommand({
        userId: user.userId,
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Password changed successfully',
    });
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<boolean> {
    await this.commandBus.execute(new DeleteAccountCommand(user.userId));
    return true;
  }
}
