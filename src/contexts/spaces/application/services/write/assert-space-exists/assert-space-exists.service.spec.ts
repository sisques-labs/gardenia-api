import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceIdValueObject } from '@contexts/spaces/domain/value-objects/space-id/space-id.value-object';

import { AssertSpaceExistsService } from './assert-space-exists.service';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';

const buildAggregate = (): SpaceAggregate =>
  new SpaceBuilder()
    .withId(SPACE_ID)
    .withName('My Garden')
    .withOwnerId(OWNER_ID)
    .withCreatedAt(new Date('2024-01-01'))
    .withUpdatedAt(new Date('2024-01-01'))
    .build();

describe('AssertSpaceExistsService', () => {
  let service: AssertSpaceExistsService;
  let writeRepository: jest.Mocked<ISpaceWriteRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<ISpaceWriteRepository>;

    service = new AssertSpaceExistsService(writeRepository);
  });

  describe('space exists', () => {
    it('should return the aggregate when write repository finds the space', async () => {
      const aggregate = buildAggregate();
      const id = new SpaceIdValueObject(SPACE_ID);
      writeRepository.findById.mockResolvedValue(aggregate);

      const result = await service.execute(id);

      expect(result).toBe(aggregate);
      expect(writeRepository.findById).toHaveBeenCalledWith(id.value);
    });
  });

  describe('space does not exist', () => {
    it('should throw SpaceNotFoundException when write repository returns null', async () => {
      const id = new SpaceIdValueObject(SPACE_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(SpaceNotFoundException);
    });

    it('should include the space id in the thrown exception', async () => {
      const id = new SpaceIdValueObject(SPACE_ID);
      writeRepository.findById.mockResolvedValue(null);

      await expect(service.execute(id)).rejects.toThrow(SPACE_ID);
    });
  });
});
