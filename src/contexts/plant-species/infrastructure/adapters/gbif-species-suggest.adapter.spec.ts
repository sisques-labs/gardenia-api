import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { GbifSpeciesSuggestAdapter } from './gbif-species-suggest.adapter';
import { GbifSpeciesSuggestResponse } from './gbif/types/gbif-suggest-api.types';

const axiosResponse = (
  data: GbifSpeciesSuggestResponse,
): AxiosResponse<GbifSpeciesSuggestResponse> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }) as AxiosResponse<GbifSpeciesSuggestResponse>;

describe('GbifSpeciesSuggestAdapter', () => {
  let adapter: GbifSpeciesSuggestAdapter;
  let httpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    jest.clearAllMocks();
    httpService = { get: jest.fn() } as unknown as jest.Mocked<HttpService>;
    adapter = new GbifSpeciesSuggestAdapter(httpService);
  });

  it('maps GBIF suggest results to gbifKey/scientificName pairs', async () => {
    httpService.get.mockReturnValue(
      of(
        axiosResponse([
          { key: 2882337, canonicalName: 'Monstera deliciosa' },
          { key: 5352251, scientificName: 'Ficus lyrata' },
        ]),
      ),
    );

    const result = await adapter.suggest('Monstera', 10);

    expect(result).toEqual([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
      { gbifKey: 5352251, scientificName: 'Ficus lyrata' },
    ]);
  });

  it('drops entries missing a key or a name', async () => {
    httpService.get.mockReturnValue(
      of(
        axiosResponse([
          { scientificName: 'No key here' },
          { key: 123, scientificName: '' },
          { key: 2882337, canonicalName: 'Monstera deliciosa' },
        ]),
      ),
    );

    const result = await adapter.suggest('Monstera', 10);

    expect(result).toEqual([
      { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
    ]);
  });

  it('returns an empty array and does not throw on a network error', async () => {
    httpService.get.mockReturnValue(throwError(() => new Error('timeout')));

    const result = await adapter.suggest('Monstera', 10);

    expect(result).toEqual([]);
  });

  it('passes q/limit/rank params to GBIF', async () => {
    httpService.get.mockReturnValue(of(axiosResponse([])));

    await adapter.suggest('Ficus', 5);

    expect(httpService.get).toHaveBeenCalledWith(
      expect.stringContaining('/species/suggest'),
      expect.objectContaining({
        params: { q: 'Ficus', limit: 5, rank: 'SPECIES' },
      }),
    );
  });
});
