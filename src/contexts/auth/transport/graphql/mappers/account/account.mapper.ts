import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountObjectBuilder } from '@contexts/auth/transport/graphql/builders/account-object.builder';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountGraphQLMapper {
  constructor(private readonly accountObjectBuilder: AccountObjectBuilder) {}

  toViewModel(vm: AccountViewModel): AccountObject {
    return this.accountObjectBuilder
      .withId(vm.id)
      .withUserId(vm.userId)
      .withEmail(vm.email)
      .withCreatedAt(vm.createdAt)
      .withUpdatedAt(vm.updatedAt)
      .build();
  }
}
