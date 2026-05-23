import { UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CurrentUser, CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegisterUserCommand } from '@contexts/users/application/commands/register-user/register-user.command';
import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/i-user-read.repository';

import { RegisterUserInput } from './dtos/register-user.input';
import { UserObject } from './objects/user.object';

@Resolver(() => UserObject)
export class UsersResolver {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Mutation(() => Boolean)
  async register(
    @Args('input') input: RegisterUserInput,
  ): Promise<boolean> {
    await this.commandBus.execute(
      new RegisterUserCommand(input.email, input.password),
    );
    return true;
  }

  @Query(() => UserObject, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async me(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<UserObject | null> {
    const vm = await this.queryBus.execute<GetCurrentUserQuery, UserViewModel | null>(
      new GetCurrentUserQuery(user.userId),
    );
    return vm ? UserObject.fromViewModel(vm) : null;
  }
}
