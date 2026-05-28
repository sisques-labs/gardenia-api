import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { AccountRestResponseDtoBuilder } from '@contexts/auth/transport/rest/builders/account-rest-response-dto.builder';
import { AccountRestResponseDto } from '@contexts/auth/transport/rest/dtos/account-rest-response.dto';
import { Injectable } from '@nestjs/common';

export { AccountRestResponseDto };

@Injectable()
export class AccountRestMapper {
  toViewModel(vm: AccountViewModel): AccountRestResponseDto {
    return new AccountRestResponseDtoBuilder()
      .withId(vm.id)
      .withUserId(vm.userId)
      .withEmail(vm.email)
      .withCreatedAt(vm.createdAt)
      .withUpdatedAt(vm.updatedAt)
      .build();
  }
}
