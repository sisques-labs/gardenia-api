import { EventBus } from '@nestjs/cqrs';

import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { HashRefreshTokenService } from '@contexts/auth/application/services/write/hash-refresh-token/hash-refresh-token.service';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

import { LogoutCommand } from './logout.command';
import { LogoutCommandHandler } from './logout.handler';

const buildActiveSession = () =>
  new AuthSessionBuilder()
    .withId('a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1')
    .withUserId('660e8400-e29b-41d4-a716-446655440001')
    .withTokenHash('a'.repeat(64))
    .withExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    .withRevokedAt(null)
    .build();

describe('LogoutCommandHandler', () => {
  let handler: LogoutCommandHandler;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let hashRefreshTokenService: jest.Mocked<HashRefreshTokenService>;

  beforeEach(() => {
    sessionRepo = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      findById: jest.fn(),
      revokeAllByUserId: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    hashRefreshTokenService = {
      execute: jest.fn().mockResolvedValue('a'.repeat(64)),
    } as unknown as jest.Mocked<HashRefreshTokenService>;

    handler = new LogoutCommandHandler(
      eventBus,
      hashRefreshTokenService,
      sessionRepo,
    );
  });

  it('is idempotent when session is not found (silent success)', async () => {
    sessionRepo.findByTokenHash.mockResolvedValue(null);

    const command = new LogoutCommand('unknown-token');

    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('revokes the session and saves on happy path', async () => {
    const session = buildActiveSession();
    sessionRepo.findByTokenHash.mockResolvedValue(session);

    const command = new LogoutCommand('some-plain-token');

    await handler.execute(command);

    expect(sessionRepo.save).toHaveBeenCalledWith(session);
    expect(session.revokedAt).not.toBeNull();
  });
});
