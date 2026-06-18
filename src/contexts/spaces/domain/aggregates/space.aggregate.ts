import { BaseAggregate } from '@sisques-labs/nestjs-kit';

import { SpaceMembership } from '../entities/space-membership.entity';
import { MembershipRoleEnum } from '../enums/membership-role.enum';
import { MemberAddedEvent } from '../events/member-added/member-added.event';
import { MemberRemovedEvent } from '../events/member-removed/member-removed.event';
import { SpaceCreatedEvent } from '../events/space-created/space-created.event';
import { SpaceEnvironmentChangedEvent } from '../events/field-changed/space-environment-changed/space-environment-changed.event';
import { SpaceLatitudeChangedEvent } from '../events/field-changed/space-latitude-changed/space-latitude-changed.event';
import { SpaceLongitudeChangedEvent } from '../events/field-changed/space-longitude-changed/space-longitude-changed.event';
import { SpaceNameChangedEvent } from '../events/field-changed/space-name-changed/space-name-changed.event';
import { SpaceUpdatedEvent } from '../events/space-updated/space-updated.event';
import { DuplicateMembershipException } from '../exceptions/duplicate-membership.exception';
import { LastOwnerRemovalException } from '../exceptions/last-owner-removal.exception';
import { NotASpaceMemberException } from '../exceptions/not-a-space-member.exception';
import { ISpace } from '../interfaces/space.interface';
import { ISpacePrimitives } from '../primitives/space.primitives';
import { SpaceEnvironmentValueObject } from '../value-objects/space-environment/space-environment.value-object';
import { SpaceIdValueObject } from '../value-objects/space-id/space-id.value-object';
import { SpaceLatitudeValueObject } from '../value-objects/space-latitude/space-latitude.value-object';
import { SpaceLongitudeValueObject } from '../value-objects/space-longitude/space-longitude.value-object';
import { SpaceNameValueObject } from '../value-objects/space-name/space-name.value-object';

export class SpaceAggregate extends BaseAggregate {
  private readonly _id: SpaceIdValueObject;
  private _name: SpaceNameValueObject;
  private readonly _ownerId: SpaceIdValueObject;
  private _memberships: SpaceMembership[];
  private _latitude: SpaceLatitudeValueObject | null;
  private _longitude: SpaceLongitudeValueObject | null;
  private _environment: SpaceEnvironmentValueObject | null;

  constructor(props: ISpace) {
    super(props.createdAt, props.updatedAt);
    this._id = props.id;
    this._name = props.name;
    this._ownerId = props.ownerId;
    this._memberships = [];
    this._latitude = props.latitude ?? null;
    this._longitude = props.longitude ?? null;
    this._environment = props.environment ?? null;
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

  public update(props: {
    name?: SpaceNameValueObject;
    latitude?: SpaceLatitudeValueObject | null;
    longitude?: SpaceLongitudeValueObject | null;
    environment?: SpaceEnvironmentValueObject | null;
  }): void {
    if (props.name !== undefined) this.changeName(props.name);
    if (props.latitude !== undefined) this.changeLatitude(props.latitude);
    if (props.longitude !== undefined) this.changeLongitude(props.longitude);
    if (props.environment !== undefined) this.changeEnvironment(props.environment);

    this.apply(
      new SpaceUpdatedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceUpdatedEvent.name,
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

  private changeName(newName: SpaceNameValueObject): void {
    const oldValue = this._name.value;
    const newValue = newName.value;

    if (oldValue === newValue) return;

    this._name = newName;
    this.touch();

    this.apply(
      new SpaceNameChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceNameChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeLatitude(newLatitude: SpaceLatitudeValueObject | null): void {
    const oldValue = this._latitude?.value ?? null;
    const newValue = newLatitude?.value ?? null;

    if (oldValue === newValue) return;

    this._latitude = newLatitude;
    this.touch();

    this.apply(
      new SpaceLatitudeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceLatitudeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeLongitude(newLongitude: SpaceLongitudeValueObject | null): void {
    const oldValue = this._longitude?.value ?? null;
    const newValue = newLongitude?.value ?? null;

    if (oldValue === newValue) return;

    this._longitude = newLongitude;
    this.touch();

    this.apply(
      new SpaceLongitudeChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceLongitudeChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
      ),
    );
  }

  private changeEnvironment(newEnvironment: SpaceEnvironmentValueObject | null): void {
    const oldValue = this._environment?.value ?? null;
    const newValue = newEnvironment?.value ?? null;

    if (oldValue === newValue) return;

    this._environment = newEnvironment;
    this.touch();

    this.apply(
      new SpaceEnvironmentChangedEvent(
        {
          aggregateRootId: this._id.value,
          aggregateRootType: SpaceAggregate.name,
          entityId: this._id.value,
          entityType: SpaceAggregate.name,
          eventType: SpaceEnvironmentChangedEvent.name,
        },
        { id: this._id.value, oldValue, newValue },
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
      latitude: this._latitude?.value ?? null,
      longitude: this._longitude?.value ?? null,
      environment: this._environment?.value ?? null,
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

  get latitude(): number | null {
    return this._latitude?.value ?? null;
  }

  get longitude(): number | null {
    return this._longitude?.value ?? null;
  }

  get environment(): string | null {
    return this._environment?.value ?? null;
  }
}
