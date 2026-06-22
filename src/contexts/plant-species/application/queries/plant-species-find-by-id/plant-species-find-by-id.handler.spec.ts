import { AssertPlantSpeciesViewModelExistsService } from '@contexts/plant-species/application/services/read/assert-plant-species-view-model-exists/assert-plant-species-view-model-exists.service';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesFindByIdQuery } from './plant-species-find-by-id.query';
import { PlantSpeciesFindByIdQueryHandler } from './plant-species-find-by-id.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantSpeciesFindByIdQueryHandler', () => {
  let handler: PlantSpeciesFindByIdQueryHandler;
  let assertExists: jest.Mocked<AssertPlantSpeciesViewModelExistsService>;

  beforeEach(() => {
    jest.clearAllMocks();
    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantSpeciesViewModelExistsService>;
    handler = new PlantSpeciesFindByIdQueryHandler(assertExists);
  });

  it('returns the view model resolved by the assert service', async () => {
    const vm = { id: ID } as PlantSpeciesViewModel;
    assertExists.execute.mockResolvedValue(vm);

    const result = await handler.execute(
      new PlantSpeciesFindByIdQuery({ plantSpeciesId: ID }),
    );

    expect(result).toBe(vm);
    expect(assertExists.execute).toHaveBeenCalledWith(
      expect.objectContaining({ value: ID }),
    );
  });

  it('propagates when the species view model does not exist', async () => {
    assertExists.execute.mockRejectedValue(new Error('not found'));

    await expect(
      handler.execute(new PlantSpeciesFindByIdQuery({ plantSpeciesId: ID })),
    ).rejects.toThrow('not found');
  });
});
