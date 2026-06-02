import { PlantFindByIdQueryHandler } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.handler';
import { PlantFindByIdQuery } from '@contexts/plants/application/queries/plant-find-by-id/plant-find-by-id.query';
import { EnrichPlantWithQrService } from '@contexts/plants/application/services/read/enrich-plant-with-qr/enrich-plant-with-qr.service';
import { EnrichPlantWithSpeciesService } from '@contexts/plants/application/services/read/enrich-plant-with-species/enrich-plant-with-species.service';
import { PlantNotFoundException } from '@contexts/plants/domain/exceptions/plant-not-found.exception';
import { PlantIdValueObject } from '@contexts/plants/domain/value-objects/plant-id/plant-id.value-object';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { AssertPlantViewModelExistsService } from '../../services/read/assert-plant-view-model-exists/assert-plant-view-model-exists.service';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): PlantViewModel =>
  new PlantViewModel({
    id: PLANT_ID,
    name: 'Rose',
    plantSpeciesId: null,
    imageUrl: null,
    userId: USER_ID,
    spaceId: SPACE_ID,
    qrId: null,
    plantingSpotId: null,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('PlantFindByIdQueryHandler', () => {
  let handler: PlantFindByIdQueryHandler;
  let assertService: jest.Mocked<AssertPlantViewModelExistsService>;
  let enrichSpeciesService: jest.Mocked<EnrichPlantWithSpeciesService>;
  let enrichQrService: jest.Mocked<EnrichPlantWithQrService>;

  beforeEach(() => {
    jest.clearAllMocks();

    assertService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertPlantViewModelExistsService>;

    enrichSpeciesService = {
      execute: jest.fn().mockImplementation((plant) => Promise.resolve(plant)),
    } as unknown as jest.Mocked<EnrichPlantWithSpeciesService>;

    enrichQrService = {
      execute: jest.fn().mockImplementation((plant) => Promise.resolve(plant)),
    } as unknown as jest.Mocked<EnrichPlantWithQrService>;

    handler = new PlantFindByIdQueryHandler(
      assertService,
      enrichSpeciesService,
      enrichQrService,
    );
  });

  describe('plant found', () => {
    it('should return PlantViewModel when plant exists', async () => {
      const viewModel = buildViewModel();
      assertService.execute.mockResolvedValue(viewModel);

      const query = new PlantFindByIdQuery({ plantId: PLANT_ID });
      const result = await handler.execute(query);

      expect(result).toBe(viewModel);
      expect(assertService.execute).toHaveBeenCalledWith(
        expect.any(PlantIdValueObject),
      );
      expect(enrichSpeciesService.execute).toHaveBeenCalledWith(viewModel);
      expect(enrichQrService.execute).toHaveBeenCalledWith(viewModel);
    });
  });

  describe('plant not found', () => {
    it('should propagate PlantNotFoundException', async () => {
      assertService.execute.mockRejectedValue(
        new PlantNotFoundException(PLANT_ID),
      );

      const query = new PlantFindByIdQuery({ plantId: PLANT_ID });

      await expect(handler.execute(query)).rejects.toThrow(
        PlantNotFoundException,
      );
    });
  });
});
