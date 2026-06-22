import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

import { GbifPlantSpeciesImportAdapter } from './gbif-plant-species-import.adapter';

const USAGE_KEY = 12345;

const matchResponse = (overrides = {}) => ({
  usageKey: USAGE_KEY,
  matchType: 'EXACT',
  canonicalName: 'Aloe vera',
  scientificName: 'Aloe vera (L.) Burm.f.',
  ...overrides,
});

const speciesResponse = () => ({
  descriptions: [
    { language: 'eng', description: 'A succulent plant species.' },
  ],
  vernacularNames: [],
});

const mediaResponse = () => ({
  results: [{ identifier: 'https://example.com/aloe.jpg' }],
});

const searchResponse = () => ({
  results: [
    { key: USAGE_KEY, canonicalName: 'Aloe vera', scientificName: 'Aloe vera' },
  ],
});

describe('GbifPlantSpeciesImportAdapter', () => {
  let adapter: GbifPlantSpeciesImportAdapter;
  let httpService: jest.Mocked<HttpService>;

  const wireHttp = () => {
    (httpService.get as jest.Mock).mockImplementation((url: string) => {
      if (url.endsWith('/species/match')) return of({ data: matchResponse() });
      if (url.includes('/species/search'))
        return of({ data: searchResponse() });
      if (url.endsWith('/media')) return of({ data: mediaResponse() });
      return of({ data: speciesResponse() });
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    httpService = { get: jest.fn() } as unknown as jest.Mocked<HttpService>;
    adapter = new GbifPlantSpeciesImportAdapter(httpService);
  });

  describe('fetchByScientificName()', () => {
    it('returns an enriched record on a successful match', async () => {
      wireHttp();

      const record = await adapter.fetchByScientificName('Aloe vera');

      expect(record).not.toBeNull();
      expect(record?.scientificName).toBe('Aloe vera');
      expect(record?.description).toBe('A succulent plant species.');
      expect(record?.imageUrl).toBe('https://example.com/aloe.jpg');
    });

    it('returns null when there is no taxonomic match', async () => {
      (httpService.get as jest.Mock).mockReturnValue(
        of({ data: { matchType: 'NONE' } }),
      );

      expect(await adapter.fetchByScientificName('Unknown')).toBeNull();
    });

    it('returns null when the lookup throws', async () => {
      (httpService.get as jest.Mock).mockImplementation(() => {
        throw new Error('network');
      });

      expect(await adapter.fetchByScientificName('Aloe vera')).toBeNull();
    });
  });

  describe('fetchPage()', () => {
    it('maps the search results into import records', async () => {
      wireHttp();

      const records = await adapter.fetchPage(10, 0);

      expect(records).toHaveLength(1);
      expect(records[0].scientificName).toBe('Aloe vera');
      expect(records[0].imageUrl).toBe('https://example.com/aloe.jpg');
    });

    it('returns an empty array when the search request fails', async () => {
      (httpService.get as jest.Mock).mockImplementation(() => {
        throw new Error('boom');
      });

      expect(await adapter.fetchPage(10, 0)).toEqual([]);
    });
  });
});
