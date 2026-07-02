import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { BaseExceptionFilter } from '@core/filters/base-exception.filter';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { InvalidRefreshTokenHashException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-hash.exception';
import { InvalidRefreshTokenValueException } from '@contexts/auth/domain/exceptions/invalid-refresh-token-value.exception';
import { InvalidRefreshTokenException } from '@contexts/auth/domain/exceptions/invalid-refresh-token.exception';
import { RefreshTokenReuseDetectedException } from '@contexts/auth/domain/exceptions/refresh-token-reuse-detected.exception';
import { AccountAlreadyExistsException } from '@contexts/auth/domain/exceptions/account-already-exists.exception';
import { AccountNotFoundException } from '@contexts/auth/domain/exceptions/account-not-found.exception';
import { BioExceedsMaxLengthException } from '@contexts/users/domain/exceptions/bio-exceeds-max-length.exception';
import { InvalidUsernameFormatException } from '@contexts/users/domain/exceptions/invalid-username-format.exception';
import { InvalidUsernameLengthException } from '@contexts/users/domain/exceptions/invalid-username-length.exception';
import { UserAlreadyExistsException } from '@contexts/users/domain/exceptions/user-already-exists.exception';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { UsernameAlreadyTakenException } from '@contexts/users/domain/exceptions/username-already-taken.exception';
import { SpaceContextMissingException } from '@contexts/spaces/domain/exceptions/space-context-missing.exception';

const buildHttpHost = (
  statusFn = jest.fn(),
  jsonFn = jest.fn(),
): ArgumentsHost => {
  const response = {
    status: jest.fn().mockReturnValue({ json: jsonFn }),
  };
  statusFn.mockReturnValue({ json: jsonFn });
  response.status = statusFn;

  return {
    getType: jest.fn().mockReturnValue('http'),
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
    }),
  } as unknown as ArgumentsHost;
};

describe('BaseExceptionFilter', () => {
  let filter: BaseExceptionFilter;

  beforeEach(() => {
    filter = new BaseExceptionFilter();
  });

  describe('catch() — HTTP host', () => {
    it('should return 404 for UserNotFoundException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new UserNotFoundException('some-id'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should return 404 for AccountNotFoundException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new AccountNotFoundException('some-id'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should return 409 for UserAlreadyExistsException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new UserAlreadyExistsException('test@example.com'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should return 409 for AccountAlreadyExistsException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new AccountAlreadyExistsException('test@example.com'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should return 409 for UsernameAlreadyTakenException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new UsernameAlreadyTakenException('johndoe'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should return 401 for InvalidCredentialsException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidCredentialsException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for InvalidRefreshTokenException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidRefreshTokenException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should return 401 for RefreshTokenReuseDetectedException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new RefreshTokenReuseDetectedException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should return 422 for InvalidRefreshTokenHashException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidRefreshTokenHashException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 for InvalidRefreshTokenValueException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidRefreshTokenValueException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 for InvalidUsernameFormatException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidUsernameFormatException('bad user'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 for InvalidUsernameLengthException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new InvalidUsernameLengthException('ab'), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should return 422 for BioExceedsMaxLengthException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new BioExceedsMaxLengthException(600), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    });

    it('should return 500 for SpaceContextMissingException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new SpaceContextMissingException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    });

    it('should return 400 for an unrecognized BaseException', () => {
      class UnknownDomainException extends BaseException {
        constructor() {
          super('Unknown domain error');
        }
      }

      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);

      filter.catch(new UnknownDomainException(), host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    });

    it('should write the exception message in the JSON response body', () => {
      const jsonFn = jest.fn();
      const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
      const host = buildHttpHost(statusFn, jsonFn);
      const exception = new UserNotFoundException('test-id');

      filter.catch(exception, host);

      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({ message: exception.message }),
      );
    });
  });

  describe('catch() — GraphQL host', () => {
    it('should throw a GraphQLError for GraphQL', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      expect(() =>
        filter.catch(new UserNotFoundException('some-id'), host),
      ).toThrow();
    });

    it('should set extensions.code to the exception class name', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      const exception = new UserNotFoundException('some-id');

      try {
        filter.catch(exception, host);
        fail('expected filter.catch to throw');
      } catch (e: any) {
        expect(e.extensions.code).toBe('UserNotFoundException');
      }
    });

    it('should set extensions.statusCode to the resolved HTTP status', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      const exception = new UserNotFoundException('some-id');

      try {
        filter.catch(exception, host);
        fail('expected filter.catch to throw');
      } catch (e: any) {
        expect(e.extensions.statusCode).toBe(HttpStatus.NOT_FOUND);
      }
    });

    it('should preserve the exception message', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      const exception = new UserNotFoundException('some-id');

      try {
        filter.catch(exception, host);
        fail('expected filter.catch to throw');
      } catch (e: any) {
        expect(e.message).toBe(exception.message);
      }
    });

    it('should set a distinct extensions.code per exception type', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      try {
        filter.catch(new SpaceContextMissingException(), host);
        fail('expected filter.catch to throw');
      } catch (e: any) {
        expect(e.extensions.code).toBe('SpaceContextMissingException');
      }
    });
  });
});
