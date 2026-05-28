import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountGraphQLMapper {
  constructor(private readonly accountBuilder: AccountBuilder) {}

  toViewModel(vm: AccountViewModel): AccountObject {
    const built = this.accountBuilder
      .withId(vm.id)
      .withUserId(vm.userId)
      .withEmail(vm.email)
      .withCreatedAt(vm.createdAt)
      .withUpdatedAt(vm.updatedAt)
      .buildViewModel();
    const obj = new AccountObject();
    obj.id = built.id;
    obj.userId = built.userId;
    obj.email = built.email;
    obj.createdAt = built.createdAt;
    obj.updatedAt = built.updatedAt;
    return obj;
  }
}
