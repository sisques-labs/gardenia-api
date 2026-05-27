import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';

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
    >(new LoginAccountCommand({ email: input.email, password: input.password }));

    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = accessToken;
    return authPayload;
  }
}
