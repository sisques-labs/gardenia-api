import { ApiTokenAggregate } from '@contexts/auth/domain/aggregates/api-token.aggregate';
import { IApiTokenWriteRepository } from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { GenerateApiTokenService } from '@contexts/auth/application/services/write/generate-api-token/generate-api-token.service';
import { ApiTokenAuthenticateQuery } from './api-token-authenticate.query';
import { ApiTokenAuthenticateQueryHandler } from './api-token-authenticate.handler';

describe('ApiTokenAuthenticateQueryHandler', () => {
  let repository: jest.Mocked<IApiTokenWriteRepository>;
  let handler: ApiTokenAuthenticateQueryHandler;

  const RAW = `${'ght_'}abc123`;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByTokenHash: jest.fn(),
      findByUserId: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IApiTokenWriteRepository>;
    handler = new ApiTokenAuthenticateQueryHandler(repository);
  });

  it('returns null for a token without the expected prefix', async () => {
    const result = await handler.execute(
      new ApiTokenAuthenticateQuery({ rawToken: 'not-a-gardenia-token' }),
    );
    expect(result).toBeNull();
    expect(repository.findByTokenHash).not.toHaveBeenCalled();
  });

  it('returns null when no token matches the hash', async () => {
    repository.findByTokenHash.mockResolvedValue(null);
    const result = await handler.execute(
      new ApiTokenAuthenticateQuery({ rawToken: RAW }),
    );
    expect(result).toBeNull();
    expect(repository.findByTokenHash).toHaveBeenCalledWith(
      GenerateApiTokenService.hash(RAW),
    );
  });

  it('returns null for a revoked token', async () => {
    const token = {
      isRevoked: () => true,
      id: { value: 't1' },
      userId: { value: 'u1' },
      spaceId: { value: 's1' },
    } as unknown as ApiTokenAggregate;
    repository.findByTokenHash.mockResolvedValue(token);

    const result = await handler.execute(
      new ApiTokenAuthenticateQuery({ rawToken: RAW }),
    );
    expect(result).toBeNull();
  });

  it('resolves a valid token to its owner and space', async () => {
    const token = {
      isRevoked: () => false,
      id: { value: 't1' },
      userId: { value: 'u1' },
      spaceId: { value: 's1' },
    } as unknown as ApiTokenAggregate;
    repository.findByTokenHash.mockResolvedValue(token);

    const result = await handler.execute(
      new ApiTokenAuthenticateQuery({ rawToken: RAW }),
    );
    expect(result).toEqual({ tokenId: 't1', userId: 'u1', spaceId: 's1' });
  });
});
