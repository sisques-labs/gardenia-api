export interface ISpaceMembershipViewModel {
  userId: string;
  spaceId: string;
  role: string;
  joinedAt: Date;
}

export interface ISpaceViewModel {
  id: string;
  name: string;
  ownerId: string;
  memberships: ISpaceMembershipViewModel[];
  createdAt: Date;
  updatedAt: Date;
}
