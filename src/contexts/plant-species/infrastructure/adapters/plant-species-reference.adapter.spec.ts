import { DataSource } from 'typeorm';

import { PlantSpeciesReferenceAdapter } from './plant-species-reference.adapter';

const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';

describe('PlantSpeciesReferenceAdapter', () => {
  let adapter: PlantSpeciesReferenceAdapter;
  let dataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    jest.clearAllMocks();
    dataSource = { query: jest.fn() } as unknown as jest.Mocked<DataSource>;
    adapter = new PlantSpeciesReferenceAdapter(dataSource);
  });

  it('returns the plant count for the species', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([{ count: 3 }]);

    const result = await adapter.countPlantsBySpeciesId(SPECIES_ID);

    expect(result).toBe(3);
    expect(dataSource.query).toHaveBeenCalledWith(expect.any(String), [
      SPECIES_ID,
    ]);
  });

  it('returns 0 when the query yields no rows', async () => {
    (dataSource.query as jest.Mock).mockResolvedValue([]);

    expect(await adapter.countPlantsBySpeciesId(SPECIES_ID)).toBe(0);
  });
});
