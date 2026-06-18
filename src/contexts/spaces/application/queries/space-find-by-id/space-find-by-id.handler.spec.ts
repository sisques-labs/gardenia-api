import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { SpaceNotFoundException } from '@contexts/spaces/domain/exceptions/space-not-found.exception';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceFindByIdQuery } from './space-find-by-id.query';
import { SpaceFindByIdQueryHandler } from './space-find-by-id.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('SpaceFindByIdQueryHandler', () => {
  let handler: SpaceFindByIdQueryHandler;
  let assertSpaceViewModelExistsService: jest.Mocked<AssertSpaceViewModelExistsService>;
  let spaceViewModel: SpaceViewModel;

  beforeEach(() => {
    jest.clearAllMocks();

    spaceViewModel = new SpaceViewModel({
      id: SPACE_ID,
      name: 'Test Space',
      ownerId: OWNER_ID,
      createdAt: NOW,
      updatedAt: NOW,
      latitude: null,
      longitude: null,
      environment: null,
    });

    assertSpaceViewModelExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertSpaceViewModelExistsService>;

    handler = new SpaceFindByIdQueryHandler(assertSpaceViewModelExistsService);
  });

  describe('found', () => {
    it('should return the space view model when it exists', async () => {
      assertSpaceViewModelExistsService.execute.mockResolvedValue(
        spaceViewModel,
      );

      const result = await handler.execute(
        new SpaceFindByIdQuery({ spaceId: SPACE_ID }),
      );

      expect(result).toBe(spaceViewModel);
    });
  });

  describe('not found', () => {
    it('should throw SpaceNotFoundException when space does not exist', async () => {
      assertSpaceViewModelExistsService.execute.mockRejectedValue(
        new SpaceNotFoundException(SPACE_ID),
      );

      await expect(
        handler.execute(new SpaceFindByIdQuery({ spaceId: SPACE_ID })),
      ).rejects.toThrow(SpaceNotFoundException);
    });
  });
});
