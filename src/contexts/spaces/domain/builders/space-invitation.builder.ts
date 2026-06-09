import { Injectable } from '@nestjs/common';
import {
  BaseBuilder,
  DateValueObject,
  FieldIsRequiredException,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { SpaceInvitationAggregate } from '../aggregates/space-invitation.aggregate';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { InvitationCodeValueObject } from '../value-objects/invitation-code/invitation-code.value-object';
import { InvitationDisplayCodeValueObject } from '../value-objects/invitation-display-code/invitation-display-code.value-object';
import { InvitationExpiresAtValueObject } from '../value-objects/invitation-expires-at/invitation-expires-at.value-object';
import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceInvitationIdValueObject } from '../value-objects/space-invitation-id/space-invitation-id.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceInvitationViewModel } from '../view-models/space-invitation.view-model';

@Injectable()
export class SpaceInvitationBuilder extends BaseBuilder<
  SpaceInvitationAggregate,
  SpaceInvitationViewModel
> {
  private _spaceId!: string;
  private _createdByUserId!: string;
  private _role: MembershipRoleEnum = MembershipRoleEnum.MEMBER;
  private _code!: string;
  private _displayCode!: string;
  private _qrId: string | null = null;
  private _expiresAt!: Date;

  withSpaceId(spaceId: string): this {
    this._spaceId = spaceId;
    return this;
  }

  withCreatedByUserId(createdByUserId: string): this {
    this._createdByUserId = createdByUserId;
    return this;
  }

  withRole(role: MembershipRoleEnum): this {
    this._role = role;
    return this;
  }

  withCode(code: string): this {
    this._code = code;
    return this;
  }

  withDisplayCode(displayCode: string): this {
    this._displayCode = displayCode;
    return this;
  }

  withQrId(qrId: string | null): this {
    this._qrId = qrId;
    return this;
  }

  withExpiresAt(expiresAt: Date): this {
    this._expiresAt = expiresAt;
    return this;
  }

  public override build(): SpaceInvitationAggregate {
    this.validate();
    return new SpaceInvitationAggregate({
      id: new SpaceInvitationIdValueObject(this._id),
      spaceId: new SpaceIdValueObject(this._spaceId),
      createdByUserId: new UuidValueObject(this._createdByUserId),
      role: new MembershipRoleValueObject(this._role),
      code: new InvitationCodeValueObject(this._code),
      displayCode: new InvitationDisplayCodeValueObject(this._displayCode),
      qrId: this._qrId ? new UuidValueObject(this._qrId) : null,
      expiresAt: new InvitationExpiresAtValueObject(this._expiresAt),
      createdAt: new DateValueObject(this._createdAt),
      updatedAt: new DateValueObject(this._updatedAt),
    });
  }

  public override buildViewModel(): SpaceInvitationViewModel {
    this.validate();
    return new SpaceInvitationViewModel({
      id: this._id,
      spaceId: this._spaceId,
      createdByUserId: this._createdByUserId,
      role: this._role,
      code: this._code,
      displayCode: this._displayCode,
      qrId: this._qrId,
      expiresAt: this._expiresAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    });
  }

  public override validate(): void {
    super.validate();
    if (!this._spaceId) throw new FieldIsRequiredException('spaceId');
    if (!this._createdByUserId) {
      throw new FieldIsRequiredException('createdByUserId');
    }
    if (!this._code) throw new FieldIsRequiredException('code');
    if (!this._displayCode) throw new FieldIsRequiredException('displayCode');
    if (!this._expiresAt) throw new FieldIsRequiredException('expiresAt');
  }
}
