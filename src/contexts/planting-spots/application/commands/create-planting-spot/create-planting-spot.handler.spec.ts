import { EventBus } from '@nestjs/cqrs';

import { IPlantingSpotQrPort } from '@contexts/planting-spots/application/ports/planting-spot-qr.port';
import { PlantingSpotQrTargetUrlBuilderService } from '@contexts/planting-spots/application/services/read/planting-spot-qr-target-url-builder/planting-spot-qr-target-url-builder.service';
import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';

import { CreatePlantingSpotCommand } from './create-planting-spot.command';
import { CreatePlantingSpotCommandHandler } from './create-planting-spot.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const QR_ID = '660e8400-e29b-41d4-a716-446655440003';

describe('CreatePlantingSpotCommandHandler', () => {
  let handler: CreatePlantingSpotCommandHandler;
  let writeRepository: jest.Mocked<IPlantingSpotWriteRepository>;
  let plantingSpotQrPort: jest.Mocked<IPlantingSpotQrPort>;
  let plantingSpotQrTargetUrlBuilder: jest.Mocked<PlantingSpotQrTargetUrlBuilderService>;
  let eventBus: jest.Mocked<EventBus>;
  let builder: PlantingSpotBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotWriteRepository>;

    plantingSpotQrPort = {
      findByQrId: jest.fn(),
      createForPlantingSpot: jest.fn().mockResolvedValue(QR_ID),
      delete: jest.fn(),
    };

    plantingSpotQrTargetUrlBuilder = {
      execute: jest.fn().mockResolvedValue('https://gardenia.app/qr/123'),
    } as unknown as jest.Mocked<PlantingSpotQrTargetUrlBuilderService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    builder = new PlantingSpotBuilder();

    handler = new CreatePlantingSpotCommandHandler(
      writeRepository,
      builder,
      plantingSpotQrPort,
      plantingSpotQrTargetUrlBuilder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should return a valid UUID spotId', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.RAISED_BED,
        description: null,
        capacity: null,
        row: null,
        column: null,
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
        soilType: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      const spotId = await handler.execute(command);

      expect(typeof spotId).toBe('string');
      expect(spotId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should call save on the write repository', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.POT,
        description: 'A nice pot',
        capacity: null,
        row: null,
        column: null,
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
        soilType: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should publish events after saving', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.CONTAINER,
        description: null,
        capacity: null,
        row: null,
        column: null,
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
        soilType: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should default the created spot to ACTIVE status with no fallowSince', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.RAISED_BED,
        description: null,
        capacity: null,
        row: null,
        column: null,
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
        soilType: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      const savedAggregate = writeRepository.save.mock.calls[0][0];
      expect(savedAggregate.status.value).toBe(PlantingSpotStatusEnum.ACTIVE);
      expect(savedAggregate.fallowSince).toBeNull();
    });

    it('should create the QR through the planting-spot-qr port', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.RAISED_BED,
        description: null,
        capacity: null,
        row: null,
        column: null,
        dimensionsWidth: null,
        dimensionsHeight: null,
        dimensionsLength: null,
        soilType: null,
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(plantingSpotQrPort.createForPlantingSpot).toHaveBeenCalledTimes(1);
      expect(plantingSpotQrPort.createForPlantingSpot).toHaveBeenCalledWith({
        targetUrl: 'https://gardenia.app/qr/123',
        spaceId: SPACE_ID,
      });

      const savedAggregate = writeRepository.save.mock.calls[0][0];
      expect(savedAggregate.qrId?.value).toBe(QR_ID);
    });
  });
});
