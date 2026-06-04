import { BaseException } from '@sisques-labs/nestjs-kit';

export class OAuthEmailNotVerifiedException extends BaseException {
  constructor(provider: string) {
    super(
      `Provider '${provider}' returned an email address that is not verified. Cannot link account via unverified email.`,
    );
  }
}
