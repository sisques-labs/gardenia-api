export interface IUserTaskPrimitives {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledDate: Date;
  taskTemplateId: string | null;
  userId: string;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
