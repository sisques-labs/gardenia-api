import { AssertAccountViewModelExistsService } from '@contexts/auth/application/services/read/assert-account-view-model-exists/assert-account-view-model-exists.service';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AccountFindByIdQuery } from './account-find-by-id.query';

@QueryHandler(AccountFindByIdQuery)
export class AccountFindByIdQueryHandler implements IQueryHandler<AccountFindByIdQuery> {
  constructor(
    private readonly assertAccountViewModelExistsService: AssertAccountViewModelExistsService,
  ) {}

  async execute(query: AccountFindByIdQuery): Promise<AccountViewModel> {
    return await this.assertAccountViewModelExistsService.execute(query.id);
  }
}
