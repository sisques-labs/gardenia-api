import { CommandBus, EventBus } from '@nestjs/cqrs';

import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import { IPlantWriteRepository } from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';

import { CreatePlantCommand } from './create-plant.command';
import { CreatePlantCommandHandler } from './create-plant.handler';

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';

describe('CreatePlantCommandHandler', () => {
  let handler: CreatePlantCommandHandler;
  let writeRepository: jest.Mocked<IPlantWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let plantBuilder: PlantBuilder;
  let spaceContext: jest.Mocked<SpaceContext>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn(),
    } as jest.Mocked<IPlantWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    plantBuilder = new PlantBuilder();

    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
      get: jest.fn().mockReturnValue(SPACE_ID),
      set: jest.fn(),
      clear: jest.fn(),
    } as unknown as jest.Mocked<SpaceContext>;

    commandBus = {
      execute: jest
        .fn()
        .mockResolvedValueOnce('660e8400-e29b-41d4-a716-446655440099')
        .mockResolvedValueOnce(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    const plantQrTargetUrlBuilder = {
      execute: jest
        .fn()
        .mockResolvedValue(
          `http://localhost:3000/plants/mock?spaceId=${SPACE_ID}`,
        ),
    };

    handler = new CreatePlantCommandHandler(
      writeRepository,
      plantBuilder,
      spaceContext,
      commandBus,
      plantQrTargetUrlBuilder as never,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should return a valid UUID plantId', async () => {
      const command = new CreatePlantCommand({ name: 'Rose', userId: USER_ID });

      const plantId = await handler.execute(command);

      expect(typeof plantId).toBe('string');
      expect(plantId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should call save on the write repository', async () => {
      const command = new CreatePlantCommand({ name: 'Rose', userId: USER_ID });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should publish events after saving', async () => {
      const command = new CreatePlantCommand({ name: 'Rose', userId: USER_ID });

      await handler.execute(command);

      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should use spaceContext.require() for spaceId', async () => {
      const command = new CreatePlantCommand({ name: 'Rose', userId: USER_ID });

      await handler.execute(command);

      expect(spaceContext.require).toHaveBeenCalled();
    });

    it('should create plant with species and imageUrl when provided', async () => {
      const command = new CreatePlantCommand({
        name: 'Rose',
        userId: USER_ID,
        species: 'Rosa canina',
        imageUrl: 'https://example.com/rose.jpg',
      });

      const plantId = await handler.execute(command);

      expect(plantId).toBeDefined();
      expect(writeRepository.save).toHaveBeenCalledTimes(1);
    });
  });
});
