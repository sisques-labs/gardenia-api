export interface IPlantEventData {
  id: string;
  name: string;
  plantSpeciesId: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
