import {
  BaseAggregate,
  DateValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../entities/space-membership.entity';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { MembershipRole } from '../value-objects/membership-role/membership-role.vo';
import { SpaceIdVO } from '../value-objects/space-id/space-id.vo';
import { SpaceNameVO } from '../value-objects/space-name/space-name.vo';

export interface ISpaceProps {
  id: SpaceIdVO;
  name: SpaceNameVO;
  ownerId: string;
  memberships: SpaceMembership[];
  createdAt: DateValueObject;
  updatedAt: DateValueObject;
}

export class SpaceAggregate extends BaseAggregate {
  private readonly _id: SpaceIdVO;
  private readonly _name: SpaceNameVO;
  private readonly _ownerId: string;
  private _memberships: SpaceMembership[];

  constructor(props: ISpaceProps) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._ownerId = props.ownerId;
    this._memberships = props.memberships;
  }

  static create(ownerId: string, name: string): SpaceAggregate {
    const now = new Date();
    const id = UuidValueObject.generate().value;

    const space = new SpaceAggregate({
      id: new SpaceIdVO(id),
      name: new SpaceNameVO(name),
      ownerId,
      memberships: [],
      createdAt: new DateValueObject(now),
      updatedAt: new DateValueObject(now),
    });

    space.addMember(ownerId, MembershipRole.OWNER);

    space.apply(
      new SpaceCreatedEvent(
        {
          aggregateRootId: id,
          aggregateRootType: SpaceAggregate.name,
          entityId: id,
          entityType: SpaceAggregate.name,
          eventType: SpaceCreatedEvent.name,
        },
        {
          spaceId: id,
          name,
          ownerId,
        },
      ),
    );

    return space;
  }

  addMember(
    userId: string,
    role: MembershipRole = MembershipRole.MEMBER,
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

  get id(): SpaceIdVO {
    return this._id;
  }

  get name(): SpaceNameVO {
    return this._name;
  }

  get ownerId(): string {
    return this._ownerId;
  }

  get memberships(): SpaceMembership[] {
    return [...this._memberships];
  }
}
