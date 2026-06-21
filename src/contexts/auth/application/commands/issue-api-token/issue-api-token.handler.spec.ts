import { ApiTokenBuilder } from '@contexts/auth/domain/builders/api-token.builder';
import { IApiTokenWriteRepository } from '@contexts/auth/domain/repositories/write/api-token-write.repository';
import { GenerateApiTokenService } from '@contexts/auth/application/services/write/generate-api-token/generate-api-token.service';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IssueApiTokenCommand } from './issue-api-token.command';
import { IssueApiTokenCommandHandler } from './issue-api-token.handler';

describe('IssueApiTokenCommandHandler', () => {
  let repository: jest.Mocked<IApiTokenWriteRepository>;
  let generator: jest.Mocked<GenerateApiTokenService>;
  let handler: IssueApiTokenCommandHandler;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockImplementation((aggregate) => aggregate),
      findById: jest.fn(),
      findByTokenHash: jest.fn(),
      findByUserId: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IApiTokenWriteRepository>;
    generator = {
      execute: jest
        .fn()
        .mockResolvedValue({ token: 'ght_secret', hash: 'a'.repeat(64) }),
    } as unknown as jest.Mocked<GenerateApiTokenService>;
    handler = new IssueApiTokenCommandHandler(
      repository,
      new ApiTokenBuilder(),
      generator,
    );
  });

  it('persists a token and returns the plaintext once', async () => {
    const command = new IssueApiTokenCommand({
      userId: UuidValueObject.generate().value,
      spaceId: UuidValueObject.generate().value,
      label: 'Home Assistant',
    });

    const result = await handler.execute(command);

    expect(result.token).toBe('ght_secret');
    expect(result.id).toBeDefined();
    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.tokenHash.value).toBe('a'.repeat(64));
    expect(saved.spaceId.value).toBe(command.spaceId.value);
  });
});
