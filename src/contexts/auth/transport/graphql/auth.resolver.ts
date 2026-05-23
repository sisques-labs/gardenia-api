import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { LoginUserCommand } from '@contexts/auth/application/commands/login-user/login-user.command';
import { AuthPayload } from '@contexts/auth/application/commands/login-user/login-user.handler';
import { AuthService } from '@contexts/auth/application/services/auth.service';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';

import { LoginUserInput } from './dtos/login-user.input';
import { AuthPayloadObject } from './objects/auth-payload.object';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly authService: AuthService,
  ) {}

  @Mutation(() => AuthPayloadObject)
  async login(
    @Args('input') input: LoginUserInput,
  ): Promise<AuthPayloadObject> {
    const result = await this.authService.validateUser(
      input.email,
      input.password,
    );

    if (!result) {
      throw new InvalidCredentialsException();
    }

    const payload = await this.commandBus.execute<LoginUserCommand, AuthPayload>(
      new LoginUserCommand(result.id, result.email),
    );

    const authPayload = new AuthPayloadObject();
    authPayload.accessToken = payload.accessToken;
    return authPayload;
  }
}
