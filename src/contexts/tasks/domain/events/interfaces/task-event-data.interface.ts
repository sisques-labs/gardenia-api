export interface ITaskEventData {
  id: string;
  templateId: string | null;
  handlerKey: string;
  userId: string;
  status: string;
  error?: string;
}
