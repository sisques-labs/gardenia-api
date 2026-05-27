import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseException } from '@sisques-labs/nestjs-kit';

import { BaseExceptionFilter } from '@core/filters/base-exception.filter';
import { UserNotFoundException } from '@contexts/users/domain/exceptions/user-not-found.exception';
import { UserAlreadyExistsException } from '@contexts/users/domain/exceptions/user-already-exists.exception';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';

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
      const exception = new UserNotFoundException('some-id');

      filter.catch(exception, host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });

    it('should return 409 for UserAlreadyExistsException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);
      const exception = new UserAlreadyExistsException('test@example.com');

      filter.catch(exception, host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    });

    it('should return 401 for InvalidCredentialsException', () => {
      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);
      const exception = new InvalidCredentialsException();

      filter.catch(exception, host);

      expect(statusFn).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for an unrecognized BaseException', () => {
      class UnknownDomainException extends BaseException {
        constructor() {
          super('Unknown domain error');
        }
      }

      const statusFn = jest.fn().mockReturnValue({ json: jest.fn() });
      const host = buildHttpHost(statusFn);
      const exception = new UnknownDomainException();

      filter.catch(exception, host);

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
    it('should rethrow the exception with a statusCode property for GraphQL', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      const exception = new UserNotFoundException('some-id');

      expect(() => filter.catch(exception, host)).toThrow();
    });

    it('should attach the resolved statusCode to the rethrown exception', () => {
      const host = {
        getType: jest.fn().mockReturnValue('graphql'),
      } as unknown as ArgumentsHost;

      const exception = new UserNotFoundException('some-id');

      try {
        filter.catch(exception, host);
      } catch (e: any) {
        expect(e.statusCode).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });
});
