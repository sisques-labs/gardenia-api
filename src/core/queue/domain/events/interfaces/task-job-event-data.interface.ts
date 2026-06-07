export interface ITaskJobEventData {
  taskId: string;
}

export interface ITaskJobStartedEventData extends ITaskJobEventData {
  queueJobId: string;
}

export interface ITaskJobProgressEventData extends ITaskJobEventData {
  progress: number;
}

export interface ITaskJobFailedEventData extends ITaskJobEventData {
  error: string;
  isFinal: boolean;
}
