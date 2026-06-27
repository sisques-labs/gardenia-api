import { CommandBus } from '@nestjs/cqrs';

import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { CareLogAdapter } from './care-log.adapter';

describe('CareLogAdapter (care-schedule)', () => {
  let adapter: CareLogAdapter;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;
    adapter = new CareLogAdapter(commandBus);
  });

  it('dispatches a CreateCareLogEntryCommand', async () => {
    await adapter.recordCareLogEntry({
      plantId: '110e8400-e29b-41d4-a716-446655440010',
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
      activityType: 'WATERING',
      performedAt: new Date('2026-06-27T00:00:00.000Z'),
      quantity: 250,
      unit: 'ML',
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateCareLogEntryCommand),
    );
  });
});
