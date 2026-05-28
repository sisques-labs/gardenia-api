export interface RefreshTokenCommandInput {
  refreshToken: string;
  deviceInfo?: string;
}

export class RefreshTokenCommand {
  public readonly refreshToken: string;
  public readonly deviceInfo?: string;

  constructor(input: RefreshTokenCommandInput) {
    this.refreshToken = input.refreshToken;
    this.deviceInfo = input.deviceInfo;
  }
}
