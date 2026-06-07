export class TaskJobStartedEvent {
  constructor(
    public readonly taskId: string,
    public readonly queueJobId: string,
  ) {}
}

export class TaskJobCompletedEvent {
  constructor(public readonly taskId: string) {}
}

export class TaskJobFailedEvent {
  constructor(
    public readonly taskId: string,
    public readonly error: string,
    public readonly isFinal: boolean,
  ) {}
}

export class TaskJobProgressEvent {
  constructor(
    public readonly taskId: string,
    public readonly progress: number,
  ) {}
}
