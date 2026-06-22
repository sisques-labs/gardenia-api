import { EventBus } from '@nestjs/cqrs';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { UpdateSpaceCommand } from './update-space.command';
import { UpdateSpaceCommandHandler } from './update-space.handler';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';

describe('UpdateSpaceCommandHandler', () => {
  let handler: UpdateSpaceCommandHandler;
  let writeRepository: jest.Mocked<ISpaceWriteRepository>;
  let assertExists: jest.Mocked<AssertSpaceExistsService>;
  let eventBus: jest.Mocked<EventBus>;
  let space: jest.Mocked<SpaceAggregate>;

  beforeEach(() => {
    jest.clearAllMocks();

    space = {
      update: jest.fn(),
      getUncommittedEvents: jest.fn().mockReturnValue([]),
      commit: jest.fn(),
    } as unknown as jest.Mocked<SpaceAggregate>;

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<ISpaceWriteRepository>;

    assertExists = {
      execute: jest.fn().mockResolvedValue(space),
    } as unknown as jest.Mocked<AssertSpaceExistsService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UpdateSpaceCommandHandler(
      writeRepository,
      assertExists,
      eventBus,
    );
  });

  it('updates the aggregate with the command value objects, saves and publishes', async () => {
    const command = new UpdateSpaceCommand({
      spaceId: SPACE_ID,
      name: 'My garden',
      latitude: 40.4168,
      longitude: -3.7038,
      requestingUserId: USER_ID,
    });

    await handler.execute(command);

    expect(space.update).toHaveBeenCalledWith({
      name: command.name,
      latitude: command.latitude,
      longitude: command.longitude,
      environment: command.environment,
    });
    expect(writeRepository.save).toHaveBeenCalledWith(space);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    expect(space.commit).toHaveBeenCalledTimes(1);
  });

  it('propagates when the space does not exist', async () => {
    assertExists.execute.mockRejectedValue(new Error('not found'));

    const command = new UpdateSpaceCommand({
      spaceId: SPACE_ID,
      requestingUserId: USER_ID,
    });

    await expect(handler.execute(command)).rejects.toThrow('not found');
    expect(space.update).not.toHaveBeenCalled();
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
