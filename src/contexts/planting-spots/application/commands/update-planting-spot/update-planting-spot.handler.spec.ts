import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotForbiddenException } from '@contexts/planting-spots/domain/exceptions/planting-spot-forbidden.exception';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';
import { AssertPlantingSpotExistsService } from '../../services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';

import { UpdatePlantingSpotCommand } from './update-planting-spot.command';
import { UpdatePlantingSpotCommandHandler } from './update-planting-spot.handler';

const SPOT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantingSpotAggregate =>
  new PlantingSpotAggregate({
    id: new PlantingSpotIdValueObject(SPOT_ID),
    name: new PlantingSpotNameValueObject('Bancal Norte'),
    type: new PlantingSpotTypeValueObject(PlantingSpotTypeEnum.RAISED_BED),
    description: null,
    capacity: null,
    row: null,
    column: null,
    dimensions: null,
    soilType: null,
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdatePlantingSpotCommandHandler', () => {
  let handler: UpdatePlantingSpotCommandHandler;
  let writeRepository: jest.Mocked<IPlantingSpotWriteRepository>;
  let assertExistsService: jest.Mocked<AssertPlantingSpotExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotWriteRepository>;

    assertExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantingSpotExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdatePlantingSpotCommandHandler(
      writeRepository,
      assertExistsService,
      eventBus,
    );
  });

  describe('happy path — owner updates', () => {
    it('should save and publish events when owner updates the spot', async () => {
      const aggregate = buildAggregate();
      assertExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantingSpotCommand({
        id: SPOT_ID,
        name: 'Bancal Sur',
        requestingUserId: OWNER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('owner mismatch — throws PlantingSpotForbiddenException', () => {
    it('should throw PlantingSpotForbiddenException when requesting user is not the owner', async () => {
      const aggregate = buildAggregate();
      assertExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantingSpotCommand({
        id: SPOT_ID,
        name: 'New Name',
        requestingUserId: OTHER_USER_ID,
        spaceId: SPACE_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantingSpotForbiddenException,
      );
      expect(writeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('spot not found — throws PlantingSpotNotFoundException', () => {
    it('should propagate PlantingSpotNotFoundException from assertExistsService', async () => {
      assertExistsService.execute.mockRejectedValue(
        new PlantingSpotNotFoundException(SPOT_ID),
      );

      const command = new UpdatePlantingSpotCommand({
        id: SPOT_ID,
        requestingUserId: OWNER_ID,
        spaceId: SPACE_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantingSpotNotFoundException,
      );
    });
  });
});
