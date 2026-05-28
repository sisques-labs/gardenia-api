import { EventBus } from '@nestjs/cqrs';

import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { IAuthSessionWriteRepository } from '@contexts/auth/domain/repositories/write/auth-session-write.repository';

import { LogoutAllCommand } from './logout-all.command';
import { LogoutAllCommandHandler } from './logout-all.handler';

describe('LogoutAllCommandHandler', () => {
  let handler: LogoutAllCommandHandler;
  let sessionRepo: jest.Mocked<IAuthSessionWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    sessionRepo = {
      save: jest.fn(),
      findByTokenHash: jest.fn(),
      findActiveByUserId: jest.fn(),
      findById: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(3),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LogoutAllCommandHandler(eventBus, sessionRepo);
  });

  it('calls revokeAllByUserId with the provided userId and returns void', async () => {
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const activeSession = new AuthSessionBuilder()
      .withId('a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1')
      .withUserId(userId)
      .withTokenHash('a'.repeat(64))
      .withExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .withRevokedAt(null)
      .build();
    sessionRepo.findActiveByUserId.mockResolvedValue([activeSession]);
    const command = new LogoutAllCommand({ userId });

    const result = await handler.execute(command);

    expect(sessionRepo.findActiveByUserId).toHaveBeenCalledWith(userId);
    expect(sessionRepo.save).toHaveBeenCalledWith(activeSession);
    expect(eventBus.publishAll).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
