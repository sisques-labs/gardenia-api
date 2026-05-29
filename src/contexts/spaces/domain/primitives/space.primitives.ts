export interface ISpaceMembershipPrimitives {
  userId: string;
  spaceId: string;
  role: string;
  joinedAt: Date;
}

export interface ISpacePrimitives {
  id: string;
  name: string;
  ownerId: string;
  memberships: ISpaceMembershipPrimitives[];
  createdAt: Date;
  updatedAt: Date;
}
