import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { CreateSpaceCommand } from './create-space.command';
import { CreateSpaceCommandHandler } from './create-space.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_NAME = 'My Space';

describe('CreateSpaceCommandHandler', () => {
  let handler: CreateSpaceCommandHandler;
  let membershipReadRepository: jest.Mocked<IMembershipReadRepository>;
  let spaceWriteRepository: jest.Mocked<ISpaceWriteRepository>;
  let configService: jest.Mocked<ConfigService>;
  let eventBus: jest.Mocked<EventBus>;
  let spaceBuilder: SpaceBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    membershipReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByUserAndSpace: jest.fn(),
      countByOwner: jest.fn(),
    } as jest.Mocked<IMembershipReadRepository>;

    spaceWriteRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISpaceWriteRepository>;

    configService = {
      get: jest.fn().mockReturnValue(5),
    } as unknown as jest.Mocked<ConfigService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    spaceBuilder = new SpaceBuilder();

    handler = new CreateSpaceCommandHandler(
      membershipReadRepository,
      spaceWriteRepository,
      configService,
      spaceBuilder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should create and save a space when under the cap', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(2);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      const spaceId = await handler.execute(
        new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(typeof spaceId).toBe('string');
      expect(spaceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should publish events after saving', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(
        new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
      );

      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should check cap before saving', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(5);
      configService.get.mockReturnValue(5);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);

      expect(spaceWriteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cap enforcement', () => {
    it('should throw SpaceLimitExceededException when at the cap', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(5);
      configService.get.mockReturnValue(5);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);
    });

    it('should read MAX_SPACES_PER_USER from config', async () => {
      configService.get.mockReturnValue(3);
      membershipReadRepository.countByOwner.mockResolvedValue(3);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);

      expect(configService.get).toHaveBeenCalledWith('MAX_SPACES_PER_USER', 5);
    });
  });

  describe('repository failure', () => {
    it('should propagate errors from save', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow('DB error');
    });
  });
});
