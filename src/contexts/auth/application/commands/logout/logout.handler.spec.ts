import { EventBus } from '@nestjs/cqrs';

import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

import { LogoutCommand } from './logout.command';
import { LogoutCommandHandler } from './logout.handler';

const buildActiveSession = () =>
  AuthSessionBuilder.build({
    id: 'a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1',
    userId: '660e8400-e29b-41d4-a716-446655440001',
    tokenHash: 'a'.repeat(64),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    revokedAt: null,
  });

describe('LogoutCommandHandler', () => {
  let handler: LogoutCommandHandler;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    sessionRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      findByTokenHash: jest.fn(),
      findById: jest.fn(),
      revokeAllByUserId: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LogoutCommandHandler(eventBus, sessionRepo);
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
