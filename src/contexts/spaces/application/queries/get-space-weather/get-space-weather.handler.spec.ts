import { ISpaceWeatherForecast } from '@contexts/spaces/application/ports/space-weather-forecast.interface';
import { ISpaceWeatherPort } from '@contexts/spaces/application/ports/space-weather.port';
import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { AssertSpaceHasGeolocationService } from '@contexts/spaces/application/services/read/assert-space-has-geolocation/assert-space-has-geolocation.service';
import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';
import { GetSpaceWeatherQuery } from './get-space-weather.query';
import { GetSpaceWeatherQueryHandler } from './get-space-weather.handler';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const LAT = 40.4168;
const LON = -3.7038;

describe('GetSpaceWeatherQueryHandler', () => {
  let handler: GetSpaceWeatherQueryHandler;
  let assertExists: jest.Mocked<AssertSpaceViewModelExistsService>;
  let assertGeo: jest.Mocked<AssertSpaceHasGeolocationService>;
  let weatherPort: jest.Mocked<ISpaceWeatherPort>;

  beforeEach(() => {
    jest.clearAllMocks();

    assertExists = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertSpaceViewModelExistsService>;
    assertGeo = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertSpaceHasGeolocationService>;
    weatherPort = {
      getForecast: jest.fn(),
    } as unknown as jest.Mocked<ISpaceWeatherPort>;

    handler = new GetSpaceWeatherQueryHandler(
      assertExists,
      assertGeo,
      weatherPort,
    );
  });

  it('resolves the space, asserts geolocation and forwards lat/lon to the port', async () => {
    const vm = { latitude: LAT, longitude: LON } as SpaceViewModel;
    assertExists.execute.mockResolvedValue(vm);
    const forecast = {} as ISpaceWeatherForecast;
    weatherPort.getForecast.mockResolvedValue(forecast);

    const result = await handler.execute(
      new GetSpaceWeatherQuery({ spaceId: SPACE_ID }),
    );

    expect(assertExists.execute).toHaveBeenCalledTimes(1);
    expect(assertGeo.execute).toHaveBeenCalledWith(vm);
    expect(weatherPort.getForecast).toHaveBeenCalledWith(LAT, LON);
    expect(result).toBe(forecast);
  });

  it('does not call the weather port when the space has no geolocation', async () => {
    assertExists.execute.mockResolvedValue({} as SpaceViewModel);
    assertGeo.execute.mockRejectedValue(new Error('no geolocation'));

    await expect(
      handler.execute(new GetSpaceWeatherQuery({ spaceId: SPACE_ID })),
    ).rejects.toThrow('no geolocation');
    expect(weatherPort.getForecast).not.toHaveBeenCalled();
  });
});
