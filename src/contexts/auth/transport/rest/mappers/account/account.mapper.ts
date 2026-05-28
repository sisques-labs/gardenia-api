import { AccountViewModel } from '@contexts/auth/domain/view-models/account.view-model';
import { Injectable } from '@nestjs/common';

export interface AccountRestResponseDto {
  id: string;
  userId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AccountRestMapper {
  toResponseDto(vm: AccountViewModel): AccountRestResponseDto {
    return {
      id: vm.id,
      userId: vm.userId,
      email: vm.email,
      createdAt: vm.createdAt,
      updatedAt: vm.updatedAt,
    };
  }
}
