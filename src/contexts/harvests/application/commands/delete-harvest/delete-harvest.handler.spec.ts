import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestNotFoundException } from '@contexts/harvests/domain/exceptions/harvest-not-found.exception';
import { IHarvestWriteRepository } from '@contexts/harvests/domain/repositories/write/harvest-write.repository';
import { AssertHarvestExistsService } from '@contexts/harvests/application/services/write/assert-harvest-exists/assert-harvest-exists.service';
import { HarvestCropTypeValueObject } from '@contexts/harvests/domain/value-objects/harvest-crop-type/harvest-crop-type.value-object';
import { HarvestHarvestedAtValueObject } from '@contexts/harvests/domain/value-objects/harvest-harvested-at/harvest-harvested-at.value-object';
import { HarvestIdValueObject } from '@contexts/harvests/domain/value-objects/harvest-id/harvest-id.value-object';
import { HarvestQuantityValueObject } from '@contexts/harvests/domain/value-objects/harvest-quantity/harvest-quantity.value-object';
import { HarvestUnitValueObject } from '@contexts/harvests/domain/value-objects/harvest-unit/harvest-unit.value-object';
import { DeleteHarvestCommand } from './delete-harvest.command';
import { DeleteHarvestCommandHandler } from './delete-harvest.handler';

function buildAggregate(): HarvestAggregate {
  return new HarvestAggregate({
    id: new HarvestIdValueObject('550e8400-e29b-41d4-a716-446655440000'),
    cropType: new HarvestCropTypeValueObject('Tomate Cherry'),
    quantity: new HarvestQuantityValueObject(2.5),
    unit: new HarvestUnitValueObject(HarvestUnitEnum.KG),
    harvestedAt: new HarvestHarvestedAtValueObject(new Date('2026-06-01')),
    userId: new UuidValueObject('660e8400-e29b-41d4-a716-446655440001'),
    spaceId: new UuidValueObject('770e8400-e29b-41d4-a716-446655440002'),
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('DeleteHarvestCommandHandler', () => {
  let handler: DeleteHarvestCommandHandler;
  let mockWriteRepo: jest.Mocked<IHarvestWriteRepository>;
  let mockAssertService: jest.Mocked<AssertHarvestExistsService>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IHarvestWriteRepository>;

    mockAssertService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertHarvestExistsService>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeleteHarvestCommandHandler(
      mockWriteRepo,
      mockAssertService,
      mockEventBus,
    );
  });

  it('deletes the harvest when found', async () => {
    const aggregate = buildAggregate();
    mockAssertService.execute.mockResolvedValue(aggregate);

    const command = new DeleteHarvestCommand({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    await handler.execute(command);

    expect(mockWriteRepo.delete).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('throws HarvestNotFoundException when harvest not found', async () => {
    mockAssertService.execute.mockRejectedValue(
      new HarvestNotFoundException('550e8400-e29b-41d4-a716-446655440000'),
    );

    const command = new DeleteHarvestCommand({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });

    await expect(handler.execute(command)).rejects.toThrow(
      HarvestNotFoundException,
    );
  });
});
