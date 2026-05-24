import { UserFindByIdQuery } from '@contexts/users/application/queries/user-find-by-id/user-find-by-id.query';
import { AssertUserViewModelExistsService } from '@contexts/users/application/services/read/assert-user-view-model-exists/assert-user-view-model-exists.service';
import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(UserFindByIdQuery)
export class UserFindByIdQueryHandler implements IQueryHandler<UserFindByIdQuery> {
  constructor(
    private readonly assertUserViewModelExistsService: AssertUserViewModelExistsService,
  ) {}

  async execute(query: UserFindByIdQuery): Promise<UserViewModel> {
    return await this.assertUserViewModelExistsService.execute(query.id);
  }
}
