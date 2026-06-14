import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { CareLogEntryAggregate } from '@contexts/care-log/domain/aggregates/care-log-entry.aggregate';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogEntryForbiddenException } from '@contexts/care-log/domain/exceptions/care-log-entry-forbidden.exception';
import { CareLogEntryNotFoundException } from '@contexts/care-log/domain/exceptions/care-log-entry-not-found.exception';
import { ICareLogEntryWriteRepository } from '@contexts/care-log/domain/repositories/write/care-log-entry-write.repository';
import { CareLogIdValueObject } from '@contexts/care-log/domain/value-objects/care-log-id/care-log-id.value-object';
import { CareLogActivityTypeValueObject } from '@contexts/care-log/domain/value-objects/care-log-activity-type/care-log-activity-type.value-object';
import { CareLogPerformedAtValueObject } from '@contexts/care-log/domain/value-objects/care-log-performed-at/care-log-performed-at.value-object';
import { AssertCareLogEntryExistsService } from '@contexts/care-log/application/services/write/assert-care-log-entry-exists/assert-care-log-entry-exists.service';

import { UpdateCareLogEntryCommand } from './update-care-log-entry.command';
import { UpdateCareLogEntryCommandHandler } from './update-care-log-entry.handler';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440002';
const OTHER_USER_ID = '550e8400-e29b-41d4-a716-446655440099';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2024-01-01T00:00:00.000Z');

const buildAggregate = (): CareLogEntryAggregate =>
  new CareLogEntryAggregate({
    id: new CareLogIdValueObject(ENTRY_ID),
    plantId: new UuidValueObject(PLANT_ID),
    userId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    activityType: new CareLogActivityTypeValueObject(CareLogActivityTypeEnum.WATERING),
    performedAt: new CareLogPerformedAtValueObject(NOW),
    notes: null,
    quantity: null,
    unit: null,
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('UpdateCareLogEntryCommandHandler', () => {
  let handler: UpdateCareLogEntryCommandHandler;
  let writeRepository: jest.Mocked<ICareLogEntryWriteRepository>;
  let assertExists: jest.Mocked<AssertCareLogEntryExistsService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation(async (entry) => entry),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<ICareLogEntryWriteRepository>;

    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertCareLogEntryExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdateCareLogEntryCommandHandler(
      writeRepository,
      assertExists,
      eventBus,
    );
  });

  describe('happy path — owner updates', () => {
    it('should save and publish events when owner updates the entry', async () => {
      const aggregate = buildAggregate();
      assertExists.execute.mockResolvedValue(aggregate);

      const command = new UpdateCareLogEntryCommand({
        id: ENTRY_ID,
        requestingUserId: OWNER_ID,
        activityType: CareLogActivityTypeEnum.FERTILIZING,
      });

      await handler.execute(command);

      expect(writeRepository.save).toHaveBeenCalledTimes(1);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('non-owner — throws CareLogEntryForbiddenException', () => {
    it('should throw when requesting user is not the owner', async () => {
      const aggregate = buildAggregate();
      assertExists.execute.mockResolvedValue(aggregate);

      const command = new UpdateCareLogEntryCommand({
        id: ENTRY_ID,
        requestingUserId: OTHER_USER_ID,
        activityType: CareLogActivityTypeEnum.FERTILIZING,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        CareLogEntryForbiddenException,
      );
      expect(writeRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('not found — propagates CareLogEntryNotFoundException', () => {
    it('should propagate the exception from assertExists', async () => {
      assertExists.execute.mockRejectedValue(
        new CareLogEntryNotFoundException(ENTRY_ID),
      );

      const command = new UpdateCareLogEntryCommand({
        id: ENTRY_ID,
        requestingUserId: OWNER_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        CareLogEntryNotFoundException,
      );
    });
  });
});
