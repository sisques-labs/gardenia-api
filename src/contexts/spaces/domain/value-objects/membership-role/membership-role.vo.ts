import { BaseException } from '@sisques-labs/nestjs-kit';

export enum MembershipRole {
  OWNER = 'owner',
  MEMBER = 'member',
}

export class InvalidMembershipRoleException extends BaseException {
  constructor(value: string) {
    super(`Invalid membership role: "${value}". Allowed values: owner, member`);
  }
}

export class MembershipRoleVO {
  private readonly _value: MembershipRole;

  constructor(value: MembershipRole) {
    const allowed = Object.values(MembershipRole) as string[];
    if (!allowed.includes(value)) {
      throw new InvalidMembershipRoleException(value);
    }
    this._value = value;
  }

  get value(): MembershipRole {
    return this._value;
  }

  isOwner(): boolean {
    return this._value === MembershipRole.OWNER;
  }

  equals(other: MembershipRoleVO): boolean {
    return this._value === other._value;
  }
}
