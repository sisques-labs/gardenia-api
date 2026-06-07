export interface ITaskEventData {
  id: string;
  templateId: string;
  handlerKey: string;
  userId: string;
  status: string;
  error?: string;
}
