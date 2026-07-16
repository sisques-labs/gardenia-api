import { AssertPlantIdentificationViewModelExistsService } from '@contexts/plant-identification/application/services/read/assert-plant-identification-view-model-exists/assert-plant-identification-view-model-exists.service';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationFindByIdQuery } from './plant-identification-find-by-id.query';
import { PlantIdentificationFindByIdQueryHandler } from './plant-identification-find-by-id.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantIdentificationFindByIdQueryHandler', () => {
  it('delegates to AssertPlantIdentificationViewModelExistsService', async () => {
    const vm = new PlantIdentificationViewModel({
      id: ID,
      requestedByUserId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
      status: PlantIdentificationStatusEnum.RESOLVED,
      resolvedSpeciesKey: 2882337,
      resolvedScientificName: 'Monstera deliciosa',
      resolvedSpeciesProvider: 'gbif',
      convertedToPlantId: null,
      photos: [],
      candidates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const mockService = {
      execute: jest.fn().mockResolvedValue(vm),
    } as unknown as jest.Mocked<AssertPlantIdentificationViewModelExistsService>;

    const handler = new PlantIdentificationFindByIdQueryHandler(mockService);
    const result = await handler.execute(
      new PlantIdentificationFindByIdQuery({ id: ID }),
    );

    expect(mockService.execute).toHaveBeenCalledWith(
      expect.objectContaining({ value: ID }),
    );
    expect(result).toBe(vm);
  });
});
