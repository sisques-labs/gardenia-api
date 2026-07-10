import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesPort } from '@contexts/plants/application/ports/plant-species.port';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { PlantPlantingSpotNotFoundException } from '@contexts/plants/domain/exceptions/plant-planting-spot-not-found.exception';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';
import { AssertPlantPlantingSpotExistsService } from '../../services/write/assert-plant-planting-spot-exists/assert-plant-planting-spot-exists.service';

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
    plantSpeciesId: null,
    imageUrl: null,
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    qrId: null,
    plantingSpotId: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdatePlantCommandHandler', () => {
  let handler: UpdatePlantCommandHandler;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;
  let assertPlantExistsService: jest.Mocked<AssertPlantExistsService>;
  let assertPlantPlantingSpotExistsService: jest.Mocked<AssertPlantPlantingSpotExistsService>;
  let plantSpeciesPort: jest.Mocked<IPlantSpeciesPort>;
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

    plantSpeciesPort = {
      findByPlantSpeciesId: jest.fn(),
      findOrCreateByGbifKey: jest.fn(),
    } as jest.Mocked<IPlantSpeciesPort>;

    assertPlantPlantingSpotExistsService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantPlantingSpotExistsService>;

    handler = new UpdatePlantCommandHandler(
      writeRepository,
      assertPlantExistsService,
      plantSpeciesPort,
      assertPlantPlantingSpotExistsService,
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

  describe('space member updates a plant they did not create', () => {
    it('should allow any requesting user to update the plant', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        name: 'Tulip',
        requestingUserId: OTHER_USER_ID,
      });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
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

  describe('assigning a planting spot', () => {
    const SPOT_ID = '550e8400-e29b-41d4-a716-446655440003';

    it('validates the spot exists in the plant space and assigns it', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        plantingSpotId: SPOT_ID,
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(assertPlantPlantingSpotExistsService.execute).toHaveBeenCalledWith(
        expect.objectContaining({ value: SPOT_ID }),
        SPACE_ID,
      );
      expect(aggregate.plantingSpotId?.value).toBe(SPOT_ID);
      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('propagates PlantPlantingSpotNotFoundException when the spot does not exist', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);
      assertPlantPlantingSpotExistsService.execute.mockRejectedValue(
        new PlantPlantingSpotNotFoundException(SPOT_ID),
      );

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        plantingSpotId: SPOT_ID,
        requestingUserId: OWNER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantPlantingSpotNotFoundException,
      );
      expect(writeRepository.save).not.toHaveBeenCalled();
    });

    it('unassigns the spot when plantingSpotId is null without validating', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        plantingSpotId: null,
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(
        assertPlantPlantingSpotExistsService.execute,
      ).not.toHaveBeenCalled();
      expect(aggregate.plantingSpotId).toBeNull();
    });
  });

  describe('linking a species via gbifSpeciesKey', () => {
    const SPECIES_ID = '550e8400-e29b-41d4-a716-446655440004';

    it('resolves the species via findOrCreateByGbifKey and links it', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);
      plantSpeciesPort.findOrCreateByGbifKey.mockResolvedValue({
        id: SPECIES_ID,
      });

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        gbifSpeciesKey: 2882337,
        speciesScientificName: 'Monstera deliciosa',
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(plantSpeciesPort.findOrCreateByGbifKey).toHaveBeenCalledWith(
        2882337,
        'Monstera deliciosa',
      );
      expect(aggregate.plantSpeciesId?.value).toBe(SPECIES_ID);
      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('unlinks the species when gbifSpeciesKey is null without calling the port', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        gbifSpeciesKey: null,
        speciesScientificName: null,
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(plantSpeciesPort.findOrCreateByGbifKey).not.toHaveBeenCalled();
      expect(aggregate.plantSpeciesId).toBeNull();
    });

    it('leaves plantSpeciesId untouched when species fields are omitted', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new UpdatePlantCommand({
        plantId: PLANT_ID,
        name: 'Tulip',
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(plantSpeciesPort.findOrCreateByGbifKey).not.toHaveBeenCalled();
      expect(aggregate.plantSpeciesId).toBeNull();
    });
  });
});
