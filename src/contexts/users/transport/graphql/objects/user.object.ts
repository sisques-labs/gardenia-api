import { Field, ID, ObjectType } from '@nestjs/graphql';

import { UserViewModel } from '@contexts/users/domain/repositories/i-user-read.repository';

@ObjectType('User')
export class UserObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Date)
  createdAt!: Date;

  static fromViewModel(vm: UserViewModel): UserObject {
    const obj = new UserObject();
    obj.id = vm.id;
    obj.email = vm.email;
    obj.createdAt = vm.createdAt;
    return obj;
  }
}
