import { BaseAggregate, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { SpaceInvitationCreatedEvent } from '../events/space-invitation-created/space-invitation-created.event';
import { ISpaceInvitation } from '../interfaces/space-invitation.interface';
import { ISpaceInvitationPrimitives } from '../primitives/space-invitation.primitives';
import { InvitationCodeValueObject } from '../value-objects/invitation-code/invitation-code.value-object';
import { InvitationDisplayCodeValueObject } from '../value-objects/invitation-display-code/invitation-display-code.value-object';
import { InvitationExpiresAtValueObject } from '../value-objects/invitation-expires-at/invitation-expires-at.value-object';
import { MembershipRoleValueObject } from '../value-objects/membership-role/membership-role.value-object';
import { SpaceInvitationIdValueObject } from '../value-objects/space-invitation-id/space-invitation-id.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';

export class SpaceInvitationAggregate extends BaseAggregate {
  private readonly _id: SpaceInvitationIdValueObject;
  private readonly _spaceId: SpaceIdValueObject;
  private readonly _createdByUserId: UuidValueObject;
  private readonly _role: MembershipRoleValueObject;
  private readonly _code: InvitationCodeValueObject;
  private readonly _displayCode: InvitationDisplayCodeValueObject;
  private readonly _qrId: UuidValueObject | null;
  private readonly _expiresAt: InvitationExpiresAtValueObject;

  constructor(props: ISpaceInvitation) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._spaceId = props.spaceId;
    this._createdByUserId = props.createdByUserId;
    this._role = props.role;
    this._code = props.code;
    this._displayCode = props.displayCode;
    this._qrId = props.qrId;
    this._expiresAt = props.expiresAt;
  }

  public create(): void {
    this.apply(
      new SpaceInvitationCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceInvitationAggregate.name,
          entityId: this._id.value,
          entityType: SpaceInvitationAggregate.name,
          eventType: SpaceInvitationCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  public isExpired(): boolean {
    return this._expiresAt.value < new Date();
  }

  public toPrimitives(): ISpaceInvitationPrimitives {
    return {
      id: this._id.value,
      spaceId: this._spaceId.value,
      createdByUserId: this._createdByUserId.value,
      role: this._role.value as MembershipRoleEnum,
      code: this._code.value,
      displayCode: this._displayCode.value,
      qrId: this._qrId?.value ?? null,
      expiresAt: this._expiresAt.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): SpaceInvitationIdValueObject {
    return this._id;
  }

  get spaceId(): SpaceIdValueObject {
    return this._spaceId;
  }

  get createdByUserId(): UuidValueObject {
    return this._createdByUserId;
  }

  get role(): MembershipRoleValueObject {
    return this._role;
  }

  get code(): InvitationCodeValueObject {
    return this._code;
  }

  get displayCode(): InvitationDisplayCodeValueObject {
    return this._displayCode;
  }

  get qrId(): UuidValueObject | null {
    return this._qrId;
  }

  get expiresAt(): InvitationExpiresAtValueObject {
    return this._expiresAt;
  }
}
