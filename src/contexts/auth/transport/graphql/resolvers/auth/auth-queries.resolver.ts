import { AccountFindByCriteriaQuery } from '@contexts/auth/application/queries/account-find-by-criteria/account-find-by-criteria.query';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { AccountGraphQLMapper } from '@contexts/auth/transport/graphql/mappers/account/account.mapper';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { QueryBus } from '@nestjs/cqrs';
import { Query, Resolver } from '@nestjs/graphql';
import { IdentityOnly } from '../../../../../../shared/decorators/identity-only.decorator';
import {
  Criteria,
  FilterOperator,
  PaginatedResult,
} from '@sisques-labs/nestjs-kit';

@Resolver()
export class AuthQueriesResolver {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly accountGraphQLMapper: AccountGraphQLMapper,
  ) {}

  @Query(() => AccountObject)
  @IdentityOnly()
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
    return this.accountGraphQLMapper.toViewModel(account);
  }
}
