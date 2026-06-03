import { PlantFindByCriteriaQuery } from '@contexts/plants/application/queries/plant-find-by-criteria/plant-find-by-criteria.query';
import { QueryBus } from '@nestjs/cqrs';
import { PlantingSpotInUseAdapter } from './planting-spot-in-use.adapter';

const SPOT_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';

describe('PlantingSpotInUseAdapter', () => {
  let adapter: PlantingSpotInUseAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantingSpotInUseAdapter(queryBus);
  });

  it('dispatches PlantFindByCriteriaQuery filtering by plantingSpotId and returns total', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 3 });

    const result = await adapter.countByPlantingSpotId(SPOT_ID);

    expect(result).toBe(3);
    expect(queryBus.execute).toHaveBeenCalledTimes(1);
    expect(queryBus.execute.mock.calls[0][0]).toBeInstanceOf(
      PlantFindByCriteriaQuery,
    );
  });

  it('returns 0 when no plants are assigned to the planting spot', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 0 });

    const result = await adapter.countByPlantingSpotId(SPOT_ID);

    expect(result).toBe(0);
  });

  it('passes the plantingSpotId filter in the criteria', async () => {
    queryBus.execute.mockResolvedValueOnce({ items: [], total: 1 });

    await adapter.countByPlantingSpotId(SPOT_ID);

    const query = queryBus.execute.mock.calls[0][0] as PlantFindByCriteriaQuery;
    const filters = query.criteria.filters;
    expect(filters).toHaveLength(1);
    expect(filters[0].field).toBe('plantingSpotId');
    expect(filters[0].value).toBe(SPOT_ID);
  });
});
