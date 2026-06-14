import { EventBus } from '@nestjs/cqrs';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { IHarvestWriteRepository } from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { CreateHarvestCommand } from './create-harvest.command';
import { CreateHarvestCommandHandler } from './create-harvest.handler';

describe('CreateHarvestCommandHandler', () => {
  let handler: CreateHarvestCommandHandler;
  let mockWriteRepo: jest.Mocked<IHarvestWriteRepository>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IHarvestWriteRepository>;

    const realBuilder = new HarvestBuilder();

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateHarvestCommandHandler(
      mockWriteRepo,
      realBuilder,
      mockEventBus,
    );
  });

  it('saves a harvest and returns harvestId', async () => {
    const command = new CreateHarvestCommand({
      cropType: 'Tomate Cherry',
      quantity: 2.5,
      unit: HarvestUnitEnum.KG,
      harvestedAt: new Date('2026-06-01'),
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
    });

    const result = await handler.execute(command);

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(typeof result).toBe('string');
    expect(result).toHaveLength(36);
  });

  it('defaults harvestedAt to now when omitted', async () => {
    const before = new Date();
    const command = new CreateHarvestCommand({
      cropType: 'Tomate Cherry',
      quantity: 2.5,
      unit: HarvestUnitEnum.KG,
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
    });
    const after = new Date();

    expect(command.harvestedAt.value.getTime()).toBeGreaterThanOrEqual(
      before.getTime(),
    );
    expect(command.harvestedAt.value.getTime()).toBeLessThanOrEqual(
      after.getTime(),
    );
  });

  it('throws when cropType is empty', () => {
    expect(
      () =>
        new CreateHarvestCommand({
          cropType: '',
          quantity: 2.5,
          unit: HarvestUnitEnum.KG,
          harvestedAt: new Date(),
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });

  it('throws when quantity is 0', () => {
    expect(
      () =>
        new CreateHarvestCommand({
          cropType: 'Tomate',
          quantity: 0,
          unit: HarvestUnitEnum.KG,
          harvestedAt: new Date(),
          userId: '660e8400-e29b-41d4-a716-446655440001',
          spaceId: '770e8400-e29b-41d4-a716-446655440002',
        }),
    ).toThrow();
  });
});
