import { QueryBus } from '@nestjs/cqrs';
import { FilterOperator } from '@sisques-labs/nestjs-kit';

import { PlantPhotoFindByCriteriaQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.query';
import { PlantPhotoFindByCriteriaMcpTool } from './plant-photo-find-by-criteria.tool';

const PLANT_ID = '22222222-2222-4222-8222-222222222222';

describe('PlantPhotoFindByCriteriaMcpTool', () => {
  let tool: PlantPhotoFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantPhotoFindByCriteriaMcpTool(queryBus);
  });

  it('dispatches PlantPhotoFindByCriteriaQuery without pagination or filters', async () => {
    const viewModel = { items: [], total: 0 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({});

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantPhotoFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantPhotoFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([]);
    expect(query.criteria.pagination).toEqual({ page: 1, perPage: 10 });
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('dispatches PlantPhotoFindByCriteriaQuery with plantId filter and pagination', async () => {
    const viewModel = { items: [{ id: '1' }], total: 1 };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    await tool.execute({ plantId: PLANT_ID, page: 2, perPage: 10 });

    const query = queryBus.execute.mock
      .calls[0][0] as PlantPhotoFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([
      { field: 'plantId', operator: FilterOperator.EQUALS, value: PLANT_ID },
    ]);
    expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
  });
});
