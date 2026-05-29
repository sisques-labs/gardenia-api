import { Injectable } from '@nestjs/common';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../entities/space-membership.entity';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { ISpaceMembership } from '../interfaces/space-membership.interface';
import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';

@Injectable()
export class SpaceMembershipBuilder {
  private _userId!: string;
  private _spaceId!: string;
  private _role!: MembershipRoleEnum;
  private _joinedAt: Date = new Date();

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withRole(role: MembershipRoleEnum): this {
    this._role = role;
    return this;
  }

  withJoinedAt(joinedAt: Date): this {
    this._joinedAt = joinedAt;
    return this;
  }

  build(): SpaceMembership {
    const props: ISpaceMembership = {
      userId: new UuidValueObject(this._userId),
      spaceId: new SpaceIdValueObject(this._spaceId),
      role: new MembershipRoleValueObject(this._role),
      joinedAt: new DateValueObject(this._joinedAt),
    };
    return new SpaceMembership(props);
  }
}
