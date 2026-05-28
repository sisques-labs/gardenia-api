import { DeviceInfoValueObject } from '@contexts/auth/domain/value-objects/device-info/device-info.vo';
import { RefreshTokenValueObject } from '@contexts/auth/domain/value-objects/refresh-token/refresh-token.vo';

export interface RefreshTokenCommandInput {
  refreshToken: string;
  deviceInfo?: string;
}

export class RefreshTokenCommand {
  public readonly refreshToken: RefreshTokenValueObject;
  public readonly deviceInfo: DeviceInfoValueObject | null;

  constructor(input: RefreshTokenCommandInput) {
    this.refreshToken = new RefreshTokenValueObject(input.refreshToken);
    this.deviceInfo = input.deviceInfo
      ? new DeviceInfoValueObject(input.deviceInfo)
      : null;
  }
}
