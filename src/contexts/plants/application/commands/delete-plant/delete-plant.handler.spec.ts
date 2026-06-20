import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IPlantQrPort } from '@contexts/plants/application/ports/plant-qr.port';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { NotPlantOwnerException } from '@contexts/plants/domain/exceptions/not-plant-owner.exception';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantNameValueObject } from '@contexts/plants/domain/value-objects/plant-name/plant-name.value-object';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';

import { DeletePlantCommand } from './delete-plant.command';
import { DeletePlantCommandHandler } from './delete-plant.handler';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const QR_ID = '660e8400-e29b-41d4-a716-446655440099';

const buildAggregate = (qrId: string | null = QR_ID): PlantAggregate =>
  new PlantAggregate({
    id: new PlantIdValueObject(PLANT_ID),
    name: new PlantNameValueObject('Rose'),
    plantSpeciesId: null,
    imageUrl: null,
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    qrId: qrId ? new UuidValueObject(qrId) : null,
    plantingSpotId: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('DeletePlantCommandHandler', () => {
  let handler: DeletePlantCommandHandler;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;
  let assertPlantExistsService: jest.Mocked<AssertPlantExistsService>;
  let eventBus: jest.Mocked<EventBus>;
  let plantQrPort: jest.Mocked<IPlantQrPort>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IPlantWriteRepository>;

    assertPlantExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    plantQrPort = {
      findByQrId: jest.fn(),
      createForPlant: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IPlantQrPort>;

    handler = new DeletePlantCommandHandler(
      writeRepository,
      assertPlantExistsService,
      plantQrPort,
      eventBus,
    );
  });

  describe('happy path — owner deletes', () => {
    it('should delete the plant and publish events', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new DeletePlantCommand({
        plantId: PLANT_ID,
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(plantQrPort.delete).toHaveBeenCalledTimes(1);
      expect(plantQrPort.delete).toHaveBeenCalledWith(QR_ID);
      expect(writeRepository.delete).toHaveBeenCalledWith(PLANT_ID);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should delete plant when no qrId is linked', async () => {
      const aggregate = buildAggregate(null);
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new DeletePlantCommand({
        plantId: PLANT_ID,
        requestingUserId: OWNER_ID,
      });

      await handler.execute(command);

      expect(plantQrPort.delete).not.toHaveBeenCalled();
      expect(writeRepository.delete).toHaveBeenCalledWith(PLANT_ID);
    });
  });

  describe('owner mismatch — throws NotPlantOwnerException', () => {
    it('should throw NotPlantOwnerException when not the owner', async () => {
      const aggregate = buildAggregate();
      assertPlantExistsService.execute.mockResolvedValue(aggregate);

      const command = new DeletePlantCommand({
        plantId: PLANT_ID,
        requestingUserId: OTHER_USER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        NotPlantOwnerException,
      );
      expect(writeRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('plant not found — throws PlantNotFoundException', () => {
    it('should propagate PlantNotFoundException from assertPlantExistsService', async () => {
      assertPlantExistsService.execute.mockRejectedValue(
        new PlantNotFoundException(PLANT_ID),
      );

      const command = new DeletePlantCommand({
        plantId: PLANT_ID,
        requestingUserId: OWNER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantNotFoundException,
      );
    });
  });
});
