import { Field, ID, ObjectType } from '@nestjs/graphql';

import { UserViewModel } from '@contexts/users/domain/repositories/read/user-read.repository';

@ObjectType('User')
export class UserObject {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  role!: string;

  @Field(() => String)
  status!: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => Date)
  createdAt!: Date;

  static fromViewModel(vm: UserViewModel): UserObject {
    const obj = new UserObject();
    obj.id = vm.id;
    obj.role = vm.role;
    obj.status = vm.status;
    obj.email = vm.email;
    obj.createdAt = vm.createdAt;
    return obj;
  }
}
