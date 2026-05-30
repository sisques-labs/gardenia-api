import { EventBus } from '@nestjs/cqrs';
import { DateValueObject } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { NotPlantOwnerException } from '@contexts/plants/domain/exceptions/not-plant-owner.exception';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';

import { UpdatePlantCommand } from './update-plant.command';
import { UpdatePlantCommandHandler } from './update-plant.handler';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildAggregate = (): PlantAggregate =>
  new PlantAggregate({
    id: new PlantIdValueObject(PLANT_ID),
    name: new PlantNameValueObject('Rose'),
    species: null,
    imageUrl: null,
    userId: OWNER_ID,
    spaceId: SPACE_ID,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdatePlantCommandHandler', () => {
  let handler: UpdatePlantCommandHandler;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;
  let assertPlantExistsService: jest.Mocked<AssertPlantExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    } as jest.Mocked<IPlantWriteRepository>;

    assertPlantExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdatePlantCommandHandler(
      writeRepository,
      assertPlantExistsService,
      eventBus,
    );
  });

  describe('happy path — owner updates', () => {
    it('should save and publish events when owner updates the plant', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        name: 'Tulip',
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('owner mismatch — throws NotPlantOwnerException', () => {
    it('should throw NotPlantOwnerException when requesting user is not the owner', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        name: 'Tulip',
        requestingUserId: OTHER_USER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        NotPlantOwnerException,
      );
      expect(writeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('plant not found — throws PlantNotFoundException', () => {
    it('should propagate PlantNotFoundException from assertPlantExistsService', async () => {
      assertPlantExistsService.execute.mockRejectedValue(
        new PlantNotFoundException(PLANT_ID),
      );

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        requestingUserId: OWNER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantNotFoundException,
      );
    });
  });
});
