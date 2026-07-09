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
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  setRefreshCookie,
} from '@contexts/auth/transport/shared/cookie.helper';
import { ChangePasswordInput } from '@contexts/auth/transport/graphql/dtos/change-password.input';
import { LoginUserInput } from '@contexts/auth/transport/graphql/dtos/login-user.input';
import { RegisterAccountInput } from '@contexts/auth/transport/graphql/dtos/register-account.input';
import { AuthPayloadObject } from '@contexts/auth/transport/graphql/objects/auth-payload.object';
import { UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { IdentityOnly } from '../../../../../../shared/decorators/identity-only.decorator';
import { SkipSpace } from '../../../../../../shared/decorators/skip-space.decorator';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

@Resolver()
export class AuthMutationsResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => String)
  @SkipSpace()
  async register(@Args('input') input: RegisterAccountInput): Promise<string> {
    const result = await this.commandBus.execute<
      RegisterAccountCommand,
      { spaceId: string }
    >(
      new RegisterAccountCommand({
        email: input.email,
        password: input.password,
      }),
    );
    return result.spaceId;
  }

  @Mutation(() => AuthPayloadObject)
  @SkipSpace()
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
  @SkipSpace()
  async refreshToken(@Context() ctx: any): Promise<AuthPayloadObject> {
    const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    if (!refreshToken) throw new UnauthorizedException();
    const result = await this.commandBus.execute<
      RefreshTokenCommand,
      { accessToken: string; refreshToken: string }
    >(new RefreshTokenCommand({ refreshToken }));
    setRefreshCookie(ctx.req.res, result.refreshToken);
    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = result.accessToken;
    return authPayload;
  }

  @Mutation(() => Boolean)
  @SkipSpace()
  async logout(@Context() ctx: any): Promise<boolean> {
    const refreshToken = ctx.req.cookies?.[REFRESH_COOKIE_NAME] as
      | string
      | undefined;
    if (refreshToken) {
      await this.commandBus.execute(new LogoutCommand({ refreshToken }));
    }
    clearRefreshCookie(ctx.req.res);
    return true;
  }

  @Mutation(() => Boolean)
  @IdentityOnly()
  async logoutAll(
    @CurrentUser() user: CurrentUserPayload,
    @Context() ctx: any,
  ): Promise<boolean> {
    await this.commandBus.execute(
      new LogoutAllCommand({ userId: user.userId }),
    );
    clearRefreshCookie(ctx.req.res);
    return true;
  }

  @Mutation(() => MutationResponseDto)
  @IdentityOnly()
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
  @IdentityOnly()
  async deleteAccount(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<boolean> {
    await this.commandBus.execute(new DeleteAccountCommand(user.userId));
    return true;
  }
}
