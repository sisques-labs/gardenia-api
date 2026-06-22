import { QueryBus } from '@nestjs/cqrs';

import { GetSpaceWeatherQuery } from '@contexts/spaces/application/queries/get-space-weather/get-space-weather.query';
import { SpaceResponseDto } from '../../dtos/responses/space/space.response.dto';
import { SpaceResolvedFieldsResolver } from './space-resolved-fields.resolver';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('SpaceResolvedFieldsResolver', () => {
  let sut: SpaceResolvedFieldsResolver;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    sut = new SpaceResolvedFieldsResolver(queryBus);
  });

  it('returns null when the space has no latitude', async () => {
    const result = await sut.weather({
      id: SPACE_ID,
      latitude: null,
      longitude: 1,
    } as unknown as SpaceResponseDto);

    expect(result).toBeNull();
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('returns null when the space has no longitude', async () => {
    const result = await sut.weather({
      id: SPACE_ID,
      latitude: 1,
      longitude: null,
    } as unknown as SpaceResponseDto);

    expect(result).toBeNull();
    expect(queryBus.execute).not.toHaveBeenCalled();
  });

  it('dispatches GetSpaceWeatherQuery when geolocation is present', async () => {
    const forecast = { daily: [] };
    queryBus.execute.mockResolvedValue(forecast);

    const result = await sut.weather({
      id: SPACE_ID,
      latitude: 40.4,
      longitude: -3.7,
    } as SpaceResponseDto);

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(GetSpaceWeatherQuery),
    );
    expect(result).toBe(forecast);
  });
});
