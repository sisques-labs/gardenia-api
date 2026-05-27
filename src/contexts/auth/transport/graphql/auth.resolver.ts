import { UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { DeleteAccountCommand } from '@contexts/auth/application/commands/delete-account/delete-account.command';
import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';

import { LoginUserInput } from './dtos/login-user.input';
import { RegisterAccountInput } from './dtos/register-account.input';
import { AuthPayloadObject } from './objects/auth-payload.object';

@Resolver()
export class AuthResolver {
  constructor(private readonly commandBus: CommandBus) {}

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
  ): Promise<AuthPayloadObject> {
    const { accessToken } = await this.commandBus.execute<
      LoginAccountCommand,
      { accessToken: string }
    >(
      new LoginAccountCommand({ email: input.email, password: input.password }),
    );

    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = accessToken;
    return authPayload;
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
