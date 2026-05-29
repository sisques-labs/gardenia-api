import {
  MembershipRole,
  MembershipRoleVO,
} from '../value-objects/membership-role/membership-role.vo';

export interface ISpaceMembershipProps {
  userId: string;
  spaceId: string;
  role: MembershipRoleVO;
  joinedAt: Date;
}

export class SpaceMembership {
  private readonly _userId: string;
  private readonly _spaceId: string;
  private readonly _role: MembershipRoleVO;
  private readonly _joinedAt: Date;

  constructor(props: ISpaceMembershipProps) {
    this._userId = props.userId;
    this._spaceId = props.spaceId;
    this._role = props.role;
    this._joinedAt = props.joinedAt;
  }

  static create(
    userId: string,
    spaceId: string,
    role: MembershipRole,
  ): SpaceMembership {
    return new SpaceMembership({
      userId,
      spaceId,
      role: new MembershipRoleVO(role),
      joinedAt: new Date(),
    });
  }

  get userId(): string {
    return this._userId;
  }

  get spaceId(): string {
    return this._spaceId;
  }

  get role(): MembershipRoleVO {
    return this._role;
  }

  get joinedAt(): Date {
    return this._joinedAt;
  }
}
