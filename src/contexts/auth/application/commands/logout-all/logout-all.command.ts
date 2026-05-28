export interface LogoutAllCommandInput {
  userId: string;
}

export class LogoutAllCommand {
  public readonly userId: string;

  constructor(input: LogoutAllCommandInput) {
    this.userId = input.userId;
  }
}
