import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountRestResponseDto } from '@contexts/auth/transport/rest/dtos/account-rest-response.dto';
import { Injectable } from '@nestjs/common';

export { AccountRestResponseDto };

@Injectable()
export class AccountRestMapper {
  constructor(private readonly accountBuilder: AccountBuilder) {}

  toViewModel(vm: AccountViewModel): AccountRestResponseDto {
    const built = this.accountBuilder
      .withId(vm.id)
      .withUserId(vm.userId)
      .withEmail(vm.email)
      .withCreatedAt(vm.createdAt)
      .withUpdatedAt(vm.updatedAt)
      .buildViewModel();
    return {
      id: built.id,
      userId: built.userId,
      email: built.email,
      createdAt: built.createdAt,
      updatedAt: built.updatedAt,
    };
  }
}
