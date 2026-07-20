import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IPlantIdentificationReadRepository } from '@contexts/plant-identification/domain/repositories/read/plant-identification-read.repository';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationFindByCriteriaQuery } from './plant-identification-find-by-criteria.query';
import { PlantIdentificationFindByCriteriaQueryHandler } from './plant-identification-find-by-criteria.handler';

describe('PlantIdentificationFindByCriteriaQueryHandler', () => {
  it('delegates to the read repository', async () => {
    const mockReadRepo: jest.Mocked<IPlantIdentificationReadRepository> = {
      findById: jest.fn(),
      findByCriteria: jest
        .fn()
        .mockResolvedValue(
          new PaginatedResult<PlantIdentificationViewModel>([], 0, 1, 20),
        ),
      save: jest.fn(),
      delete: jest.fn(),
    };
    const handler = new PlantIdentificationFindByCriteriaQueryHandler(
      mockReadRepo,
    );
    const criteria = new Criteria();

    const result = await handler.execute(
      new PlantIdentificationFindByCriteriaQuery(criteria),
    );

    expect(mockReadRepo.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result.total).toBe(0);
  });
});
