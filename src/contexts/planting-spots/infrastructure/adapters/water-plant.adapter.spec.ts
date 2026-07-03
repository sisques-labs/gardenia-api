import { CommandBus } from '@nestjs/cqrs';

import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { WaterPlantAdapter } from './water-plant.adapter';

const PLANT_ID = '110e8400-e29b-41d4-a716-446655440010';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const PERFORMED_AT = new Date('2026-06-27T00:00:00.000Z');

describe('WaterPlantAdapter', () => {
  let adapter: WaterPlantAdapter;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;
    adapter = new WaterPlantAdapter(commandBus);
  });

  it('dispatches a WaterPlantCommand with the given input', async () => {
    await adapter.waterPlant({
      plantId: PLANT_ID,
      userId: USER_ID,
      spaceId: SPACE_ID,
      performedAt: PERFORMED_AT,
    });

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = commandBus.execute.mock.calls[0][0] as WaterPlantCommand;
    expect(dispatched).toBeInstanceOf(WaterPlantCommand);
    expect(dispatched.plantId.value).toBe(PLANT_ID);
    expect(dispatched.userId.value).toBe(USER_ID);
    expect(dispatched.spaceId.value).toBe(SPACE_ID);
    expect(dispatched.performedAt).toEqual(PERFORMED_AT);
  });
});
