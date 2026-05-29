import { BaseAggregate } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../entities/space-membership.entity';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { ISpace } from '../interfaces/space.interface';
import { ISpacePrimitives } from '../primitives/space.primitives';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export class SpaceAggregate extends BaseAggregate {
  private readonly _id: SpaceIdValueObject;
  private readonly _name: SpaceNameValueObject;
  private readonly _ownerId: SpaceIdValueObject;
  private _memberships: SpaceMembership[];

  constructor(props: ISpace) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._ownerId = props.ownerId;
    this._memberships = [];
  }

  public create(): void {
    this.apply(
      new SpaceCreatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceCreatedEvent.name,
        },
        this.toPrimitives(),
      ),
    );
  }

  addMember(
    userId: string,
    role: MembershipRoleEnum = MembershipRoleEnum.MEMBER,
  ): void {
    const alreadyMember = this._memberships.some((m) => m.userId === userId);
    if (alreadyMember) {
      throw new DuplicateMembershipException(userId, this._id.value);
    }

    const membership = SpaceMembership.create(userId, this._id.value, role);
    this._memberships.push(membership);

    this.apply(
      new MemberAddedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: MemberAddedEvent.name,
        },
        {
          spaceId: this._id.value,
          userId,
          role,
        },
      ),
    );
  }

  removeMember(userId: string): void {
    const membership = this._memberships.find((m) => m.userId === userId);

    if (!membership) {
      throw new NotASpaceMemberException(userId, this._id.value);
    }

    if (membership.role.isOwner()) {
      const ownerCount = this._memberships.filter((m) =>
        m.role.isOwner(),
      ).length;
      if (ownerCount <= 1) {
        throw new LastOwnerRemovalException(this._id.value);
      }
    }

    this._memberships = this._memberships.filter((m) => m.userId !== userId);

    this.apply(
      new MemberRemovedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: MemberRemovedEvent.name,
        },
        {
          spaceId: this._id.value,
          userId,
        },
      ),
    );
  }

  toPrimitives(): ISpacePrimitives {
    return {
      id: this._id.value,
      name: this._name.value,
      ownerId: this._ownerId.value,
      createdAt: this.createdAt.value,
      updatedAt: this.updatedAt.value,
    };
  }

  get id(): SpaceIdValueObject {
    return this._id;
  }

  get name(): SpaceNameValueObject {
    return this._name;
  }

  get ownerId(): string {
    return this._ownerId.value;
  }

  get memberships(): SpaceMembership[] {
    return [...this._memberships];
  }
}
