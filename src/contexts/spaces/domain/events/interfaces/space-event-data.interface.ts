export interface ISpaceEventData {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISpaceMemberEventData {
  spaceId: string;
  userId: string;
  role: string;
}
