export interface IPlantingSpotEventData {
  id: string;
  name: string;
  type: string;
  description: string | null;
  userId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
