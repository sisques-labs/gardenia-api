import { EventBus } from '@nestjs/cqrs';

import { CareLogEntryBuilder } from '@contexts/care-log/domain/builders/care-log-entry.builder';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { ICareLogEntryWriteRepository } from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';

import { CreateCareLogEntryCommand } from './create-care-log-entry.command';
import { CreateCareLogEntryCommandHandler } from './create-care-log-entry.handler';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const PAST_DATE = new Date('2024-01-01T00:00:00.000Z');

describe('CreateCareLogEntryCommandHandler', () => {
  let handler: CreateCareLogEntryCommandHandler;
  let writeRepository: jest.Mocked<ICareLogEntryWriteRepository>;
  let builder: CareLogEntryBuilder;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation(async (entry) => entry),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<ICareLogEntryWriteRepository>;

    builder = new CareLogEntryBuilder();

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreateCareLogEntryCommandHandler(
      writeRepository,
      builder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should save the entry, return its id, and publish events', async () => {
      const command = new CreateCareLogEntryCommand({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        activityType: CareLogActivityTypeEnum.WATERING,
        performedAt: PAST_DATE,
      });

      const result = await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should default performedAt to now when not provided', async () => {
      const before = new Date();

      const command = new CreateCareLogEntryCommand({
        plantId: PLANT_ID,
        userId: USER_ID,
        spaceId: SPACE_ID,
        activityType: CareLogActivityTypeEnum.WATERING,
      });

      await handler.execute(command);

      const after = new Date();

      expect(writeRepository.save).toHaveBeenCalledTimes(1);

      const savedEntry = writeRepository.save.mock.calls[0][0];
      const savedPrimitives = savedEntry.toPrimitives();
      expect(savedPrimitives.performedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(savedPrimitives.performedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
