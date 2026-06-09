import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { ISpaceInvitationViewModelPrimitives } from '../primitives/space-invitation-view-model.primitives';

export class SpaceInvitationViewModel extends BaseViewModel {
  public readonly spaceId: string;
  public readonly createdByUserId: string;
  public readonly role: MembershipRoleEnum;
  public readonly code: string;
  public readonly displayCode: string;
  public readonly qrId: string | null;
  public readonly expiresAt: Date;

  constructor(props: ISpaceInvitationViewModelPrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.spaceId = props.spaceId;
    this.createdByUserId = props.createdByUserId;
    this.role = props.role;
    this.code = props.code;
    this.displayCode = props.displayCode;
    this.qrId = props.qrId;
    this.expiresAt = props.expiresAt;
  }
}
