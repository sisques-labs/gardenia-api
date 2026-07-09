import { AssertPlantPhotoViewModelExistsService } from '@contexts/plant-photos/application/services/read/assert-plant-photo-view-model-exists/assert-plant-photo-view-model-exists.service';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoFindByIdQuery } from './plant-photo-find-by-id.query';
import { PlantPhotoFindByIdQueryHandler } from './plant-photo-find-by-id.handler';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantPhotoFindByIdQueryHandler', () => {
  it('delegates to AssertPlantPhotoViewModelExistsService', async () => {
    const vm = {} as PlantPhotoViewModel;
    const assertService = {
      execute: jest.fn().mockResolvedValue(vm),
    } as unknown as jest.Mocked<AssertPlantPhotoViewModelExistsService>;

    const handler = new PlantPhotoFindByIdQueryHandler(assertService);
    const result = await handler.execute(
      new PlantPhotoFindByIdQuery({ id: ID }),
    );

    expect(assertService.execute).toHaveBeenCalled();
    expect(result).toBe(vm);
  });
});
