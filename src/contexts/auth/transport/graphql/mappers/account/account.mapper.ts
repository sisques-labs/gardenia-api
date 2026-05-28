import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountObject } from '@contexts/auth/transport/graphql/objects/account.object';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AccountGraphQLMapper {
  toAccountObject(vm: AccountViewModel): AccountObject {
    const obj = new AccountObject();
    obj.id = vm.id;
    obj.userId = vm.userId;
    obj.email = vm.email;
    obj.createdAt = vm.createdAt;
    obj.updatedAt = vm.updatedAt;
    return obj;
  }
}
