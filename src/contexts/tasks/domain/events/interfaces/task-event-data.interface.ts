export interface ITaskEventData {
  id: string;
  templateId: string;
  handlerKey: string;
  userId: string;
  status: string;
}

export interface ITaskTemplateEventData {
  id: string;
  name: string;
  handlerKey: string;
  userId: string;
}
