export interface LogoutCommandInput {
  refreshToken: string;
}

export class LogoutCommand {
  public readonly refreshToken: string;

  constructor(input: LogoutCommandInput) {
    this.refreshToken = input.refreshToken;
  }
}
