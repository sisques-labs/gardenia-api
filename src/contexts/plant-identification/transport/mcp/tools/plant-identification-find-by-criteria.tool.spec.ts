import { QueryBus } from '@nestjs/cqrs';
import { FilterOperator, PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationFindByCriteriaMcpTool } from './plant-identification-find-by-criteria.tool';

describe('PlantIdentificationFindByCriteriaMcpTool', () => {
  let tool: PlantIdentificationFindByCriteriaMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantIdentificationFindByCriteriaMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_identification_find_by_criteria');
    expect(tool.inputSchema).toHaveProperty('status');
  });

  it('dispatches PlantIdentificationFindByCriteriaQuery with a status filter', async () => {
    const paginated = new PaginatedResult([], 0, 1, 20);
    queryBus.execute.mockResolvedValueOnce(paginated);

    const result = await tool.execute({
      status: PlantIdentificationStatusEnum.RESOLVED,
      page: 1,
      perPage: 20,
    });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantIdentificationFindByCriteriaQuery),
    );
    const query = queryBus.execute.mock
      .calls[0][0] as PlantIdentificationFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([
      {
        field: 'status',
        operator: FilterOperator.EQUALS,
        value: PlantIdentificationStatusEnum.RESOLVED,
      },
    ]);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(paginated),
    });
  });

  it('dispatches without a status filter when none is provided', async () => {
    queryBus.execute.mockResolvedValueOnce(new PaginatedResult([], 0, 1, 20));

    await tool.execute({});

    const query = queryBus.execute.mock
      .calls[0][0] as PlantIdentificationFindByCriteriaQuery;
    expect(query.criteria.filters).toEqual([]);
  });
});
