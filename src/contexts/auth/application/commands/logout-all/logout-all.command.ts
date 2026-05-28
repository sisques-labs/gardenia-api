import { UuidValueObject } from '@sisques-labs/nestjs-kit';

export interface LogoutAllCommandInput {
  userId: string;
}

export class LogoutAllCommand {
  public readonly userId: UuidValueObject;

  constructor(input: LogoutAllCommandInput) {
    this.userId = new UuidValueObject(input.userId);
  }
}
