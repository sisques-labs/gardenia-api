import { BaseException } from '@sisques-labs/nestjs-kit';

export class TenantProvisioningUnavailableException extends BaseException {
  constructor(reason?: string) {
    super(
      `The platform tenant provisioning API is unavailable${reason ? `: ${reason}` : ''}`,
    );
  }
}
