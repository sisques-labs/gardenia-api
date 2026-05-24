export interface IAccountEventData {
  id: string;
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
