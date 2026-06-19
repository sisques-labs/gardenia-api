import { EventBus } from '@nestjs/cqrs';
import { DateValueObject, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotForbiddenException } from '@contexts/planting-spots/domain/exceptions/planting-spot-forbidden.exception';
import { PlantingSpotInUseException } from '@contexts/planting-spots/domain/exceptions/planting-spot-in-use.exception';
import { PlantingSpotNotFoundException } from '@contexts/planting-spots/domain/exceptions/planting-spot-not-found.exception';
import { IPlantingSpotWriteRepository } from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';
import { PlantingSpotIdValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-id/planting-spot-id.value-object';
import { PlantingSpotNameValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-name/planting-spot-name.value-object';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';
import { AssertPlantingSpotExistsService } from '../../services/write/assert-planting-spot-exists/assert-planting-spot-exists.service';
import { AssertPlantingSpotNotInUseService } from '../../services/write/assert-planting-spot-not-in-use/assert-planting-spot-not-in-use.service';

import { DeletePlantingSpotCommand } from './delete-planting-spot.command';
import { DeletePlantingSpotCommandHandler } from './delete-planting-spot.handler';

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

describe('DeletePlantingSpotCommandHandler', () => {
  let handler: DeletePlantingSpotCommandHandler;
  let writeRepository: jest.Mocked<IPlantingSpotWriteRepository>;
  let assertExistsService: jest.Mocked<AssertPlantingSpotExistsService>;
  let assertNotInUseService: jest.Mocked<AssertPlantingSpotNotInUseService>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IPlantingSpotWriteRepository>;

    assertExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantingSpotExistsService>;

    assertNotInUseService = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertPlantingSpotNotInUseService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new DeletePlantingSpotCommandHandler(
      writeRepository,
      assertExistsService,
      assertNotInUseService,
      eventBus,
    );
  });

  describe('happy path — owner deletes, no plants', () => {
    it('should delete the spot and publish events', async () => {
      const aggregate = buildAggregate();
      assertExistsService.execute.mockResolvedValue(aggregate);

      const command = new DeletePlantingSpotCommand({
        id: SPOT_ID,
        requestingUserId: OWNER_ID,
        spaceId: SPACE_ID,
      });

      await handler.execute(command);

      expect(writeRepository.delete).toHaveBeenCalledWith(SPOT_ID);
      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('owner mismatch — throws PlantingSpotForbiddenException', () => {
    it('should throw PlantingSpotForbiddenException when not the owner', async () => {
      const aggregate = buildAggregate();
      assertExistsService.execute.mockResolvedValue(aggregate);

      const command = new DeletePlantingSpotCommand({
        id: SPOT_ID,
        requestingUserId: OTHER_USER_ID,
        spaceId: SPACE_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantingSpotForbiddenException,
      );
      expect(writeRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('spot in use — throws PlantingSpotInUseException', () => {
    it('should throw PlantingSpotInUseException when spot is in use', async () => {
      const aggregate = buildAggregate();
      assertExistsService.execute.mockResolvedValue(aggregate);
      assertNotInUseService.execute.mockRejectedValue(
        new PlantingSpotInUseException(SPOT_ID),
      );

      const command = new DeletePlantingSpotCommand({
        id: SPOT_ID,
        requestingUserId: OWNER_ID,
        spaceId: SPACE_ID,
      });

      await expect(handler.execute(command)).rejects.toThrow(
        PlantingSpotInUseException,
      );
      expect(writeRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('spot not found — throws PlantingSpotNotFoundException', () => {
    it('should propagate PlantingSpotNotFoundException from assertExistsService', async () => {
      assertExistsService.execute.mockRejectedValue(
        new PlantingSpotNotFoundException(SPOT_ID),
      );

      const command = new DeletePlantingSpotCommand({
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
