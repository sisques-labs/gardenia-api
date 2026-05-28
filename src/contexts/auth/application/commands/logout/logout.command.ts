import { RefreshTokenValueObject } from '@contexts/auth/domain/value-objects/refresh-token/refresh-token.vo';

export interface LogoutCommandInput {
  refreshToken: string;
}

export class LogoutCommand {
  public readonly refreshToken: RefreshTokenValueObject;

  constructor(input: LogoutCommandInput) {
    this.refreshToken = new RefreshTokenValueObject(input.refreshToken);
  }
}
