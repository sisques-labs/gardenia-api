import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ISpaceWeatherForecast } from '@contexts/spaces/application/ports/space-weather-forecast.interface';
import {
  SPACE_WEATHER_PORT,
  ISpaceWeatherPort,
} from '@contexts/spaces/application/ports/space-weather.port';
import { AssertSpaceViewModelExistsService } from '@contexts/spaces/application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { AssertSpaceHasGeolocationService } from '@contexts/spaces/application/services/read/assert-space-has-geolocation/assert-space-has-geolocation.service';

import { GetSpaceWeatherQuery } from './get-space-weather.query';

@QueryHandler(GetSpaceWeatherQuery)
export class GetSpaceWeatherQueryHandler implements IQueryHandler<
  GetSpaceWeatherQuery,
  ISpaceWeatherForecast
> {
  private readonly logger = new Logger(GetSpaceWeatherQueryHandler.name);

  constructor(
    private readonly assertSpaceViewModelExistsService: AssertSpaceViewModelExistsService,
    private readonly assertSpaceHasGeolocationService: AssertSpaceHasGeolocationService,
    @Inject(SPACE_WEATHER_PORT)
    private readonly spaceWeatherPort: ISpaceWeatherPort,
  ) {}

  async execute(query: GetSpaceWeatherQuery): Promise<ISpaceWeatherForecast> {
    this.logger.log(`Getting weather for space: ${query.spaceId.value}`);

    const vm = await this.assertSpaceViewModelExistsService.execute(
      query.spaceId,
    );

    await this.assertSpaceHasGeolocationService.execute(vm);

    return this.spaceWeatherPort.getForecast(vm.latitude!, vm.longitude!);
  }
}
