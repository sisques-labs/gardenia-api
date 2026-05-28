import { EventBus } from '@nestjs/cqrs';

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
      findById: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(3),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LogoutAllCommandHandler(eventBus, sessionRepo);
  });

  it('calls revokeAllByUserId with the provided userId and returns void', async () => {
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const command = new LogoutAllCommand(userId);

    const result = await handler.execute(command);

    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith(userId);
    expect(result).toBeUndefined();
  });
});
