import { EventBus } from '@nestjs/cqrs';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';

import { CreatePlantingSpotCommand } from './create-planting-spot.command';
import { CreatePlantingSpotCommandHandler } from './create-planting-spot.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('CreatePlantingSpotCommandHandler', () => {
  let handler: CreatePlantingSpotCommandHandler;
  let writeRepository: jest.Mocked<IPlantingSpotWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let builder: PlantingSpotBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantingSpotWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    builder = new PlantingSpotBuilder();

    handler = new CreatePlantingSpotCommandHandler(
      writeRepository,
      builder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should return a valid UUID spotId', async () => {
      const command = new CreatePlantingSpotCommand({
        name: 'Bancal Norte',
        type: PlantingSpotTypeEnum.RAISED_BED,
        description: null,
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
        userId: USER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });
});
