import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { ISpaceMembership } from '../interfaces/space-membership.interface';
import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';

export class SpaceMembership {
  private readonly _userId: UuidValueObject;
  private readonly _spaceId: SpaceIdValueObject;
  private readonly _role: MembershipRoleValueObject;
  private readonly _joinedAt: DateValueObject;

  constructor(props: ISpaceMembership) {
    this._userId = props.userId;
    this._spaceId = props.spaceId;
    this._role = props.role;
    this._joinedAt = props.joinedAt;
  }

  static create(
    userId: string,
    spaceId: string,
    role: MembershipRoleEnum,
  ): SpaceMembership {
    return new SpaceMembership({
      userId: new UuidValueObject(userId),
      spaceId: new SpaceIdValueObject(spaceId),
      role: new MembershipRoleValueObject(role),
      joinedAt: new DateValueObject(new Date()),
    });
  }

  get userId(): string {
    return this._userId.value;
  }

  get spaceId(): string {
    return this._spaceId.value;
  }

  get role(): MembershipRoleValueObject {
    return this._role;
  }

  get joinedAt(): Date {
    return this._joinedAt.value;
  }
}
