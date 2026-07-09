import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IPlantPhotoReadRepository } from '@contexts/plant-photos/domain/repositories/read/plant-photo-read.repository';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoFindByCriteriaQuery } from './plant-photo-find-by-criteria.query';
import { PlantPhotoFindByCriteriaQueryHandler } from './plant-photo-find-by-criteria.handler';

describe('PlantPhotoFindByCriteriaQueryHandler', () => {
  it('delegates to the read repository', async () => {
    const readRepository = {
      findById: jest.fn(),
      findByCriteria: jest
        .fn()
        .mockResolvedValue(
          new PaginatedResult([{} as PlantPhotoViewModel], 1, 1, 20),
        ),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantPhotoReadRepository>;

    const handler = new PlantPhotoFindByCriteriaQueryHandler(readRepository);
    const criteria = new Criteria();

    const result = await handler.execute(
      new PlantPhotoFindByCriteriaQuery(criteria),
    );

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result.total).toBe(1);
  });
});
