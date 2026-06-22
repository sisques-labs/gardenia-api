import { QueryBus } from '@nestjs/cqrs';

import { PlantSpeciesBuilder } from '@contexts/plants/domain/builders/plant-species.builder';
import { PlantSpeciesAdapter } from './plant-species.adapter';

const SPECIES_ID = '880e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const catalogViewModel = () => ({
  id: SPECIES_ID,
  scientificName: 'Aloe vera',
  description: 'Succulent',
  imageUrl: 'https://example.com/aloe.png',
  createdAt: NOW,
  updatedAt: NOW,
});

describe('PlantSpeciesAdapter', () => {
  let adapter: PlantSpeciesAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    adapter = new PlantSpeciesAdapter(queryBus, new PlantSpeciesBuilder());
  });

  it('maps the catalog view model returned by the query bus', async () => {
    queryBus.execute.mockResolvedValue(catalogViewModel());

    const result = await adapter.findByPlantSpeciesId(SPECIES_ID);

    expect(result).not.toBeNull();
    expect(result?.id).toBe(SPECIES_ID);
    expect(result?.scientificName).toBe('Aloe vera');
    expect(result?.imageUrl).toBe('https://example.com/aloe.png');
  });

  it('returns null when the query resolves to null', async () => {
    queryBus.execute.mockResolvedValue(null);

    expect(await adapter.findByPlantSpeciesId(SPECIES_ID)).toBeNull();
  });

  it('returns null when the query throws', async () => {
    queryBus.execute.mockRejectedValue(new Error('not found'));

    expect(await adapter.findByPlantSpeciesId(SPECIES_ID)).toBeNull();
  });
});
