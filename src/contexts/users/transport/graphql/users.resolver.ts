import { UseGuards } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Query, Resolver } from '@nestjs/graphql';

import { CurrentUser, CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/i-user-read.repository';

import { UserObject } from './objects/user.object';

@Resolver(() => UserObject)
export class UsersResolver {
  constructor(
    private readonly queryBus: QueryBus,
  ) {}

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
