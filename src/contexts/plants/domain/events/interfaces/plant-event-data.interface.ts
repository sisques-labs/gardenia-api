export interface IPlantEventData {
  id: string;
  name: string;
  species: string | null;
  imageUrl: string | null;
  userId: string;
  spaceId: string;
  createdAt: Date;
  updatedAt: Date;
}
