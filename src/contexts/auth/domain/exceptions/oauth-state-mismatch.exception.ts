import { BaseException } from '@sisques-labs/nestjs-kit';

export class OAuthStateMismatchException extends BaseException {
  constructor() {
    super(
      'OAuth state parameter is invalid, expired, or does not match the expected provider. Possible CSRF attempt.',
    );
  }
}
