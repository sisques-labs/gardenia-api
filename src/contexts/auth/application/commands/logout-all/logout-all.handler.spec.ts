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
      findByCriteria: jest.fn(),
      delete: jest.fn(),
      rotate: jest.fn(),
    } as unknown as jest.Mocked<IAuthSessionWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new LogoutAllCommandHandler(eventBus, sessionRepo);
  });

  it('calls revokeAllByUserId once with the command userId value', async () => {
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const command = new LogoutAllCommand({ userId });

    await handler.execute(command);

    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledTimes(1);
    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith(userId);
  });

  it('does NOT call findByCriteria', async () => {
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const command = new LogoutAllCommand({ userId });

    await handler.execute(command);

    expect(sessionRepo.findByCriteria).not.toHaveBeenCalled();
  });

  it('returns void', async () => {
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const command = new LogoutAllCommand({ userId });

    const result = await handler.execute(command);

    expect(result).toBeUndefined();
  });

  it('succeeds idempotently when no sessions exist (revokeAllByUserId returns 0)', async () => {
    sessionRepo.revokeAllByUserId.mockResolvedValue(0);
    const userId = '660e8400-e29b-41d4-a716-446655440001';
    const command = new LogoutAllCommand({ userId });

    await expect(handler.execute(command)).resolves.toBeUndefined();
    expect(sessionRepo.revokeAllByUserId).toHaveBeenCalledWith(userId);
  });
});
