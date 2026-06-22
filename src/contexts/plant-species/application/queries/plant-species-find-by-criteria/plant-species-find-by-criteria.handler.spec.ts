import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { IPlantSpeciesReadRepository } from '@contexts/plant-species/domain/repositories/read/plant-species-read.repository';
import { PlantSpeciesViewModel } from '@contexts/plant-species/domain/view-models/plant-species.view-model';
import { PlantSpeciesFindByCriteriaQuery } from './plant-species-find-by-criteria.query';
import { PlantSpeciesFindByCriteriaQueryHandler } from './plant-species-find-by-criteria.handler';

describe('PlantSpeciesFindByCriteriaQueryHandler', () => {
  let handler: PlantSpeciesFindByCriteriaQueryHandler;
  let readRepository: jest.Mocked<IPlantSpeciesReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IPlantSpeciesReadRepository>;
    handler = new PlantSpeciesFindByCriteriaQueryHandler(readRepository);
  });

  it('delegates to the read repository and returns the paginated result', async () => {
    const criteria = {} as Criteria;
    const paginated = new PaginatedResult<PlantSpeciesViewModel>([], 0, 1, 10);
    readRepository.findByCriteria.mockResolvedValue(paginated);

    const result = await handler.execute(
      new PlantSpeciesFindByCriteriaQuery({ criteria }),
    );

    expect(readRepository.findByCriteria).toHaveBeenCalledWith(criteria);
    expect(result).toBe(paginated);
  });

  it('propagates repository errors', async () => {
    readRepository.findByCriteria.mockRejectedValue(new Error('DB error'));

    await expect(
      handler.execute(
        new PlantSpeciesFindByCriteriaQuery({ criteria: {} as Criteria }),
      ),
    ).rejects.toThrow('DB error');
  });
});
