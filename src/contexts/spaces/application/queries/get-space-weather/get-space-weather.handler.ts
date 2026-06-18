import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { WEATHER_PORT, IWeatherPort } from '@contexts/weather/application/ports/weather.port';
import { WeatherForecast } from '@contexts/weather/domain/interfaces/weather-forecast.interface';
import {
  SPACE_READ_REPOSITORY,
  ISpaceReadRepository,
} from '@contexts/spaces/domain/repositories/read/space-read.repository';

import { GetSpaceWeatherQuery } from './get-space-weather.query';

@QueryHandler(GetSpaceWeatherQuery)
export class GetSpaceWeatherQueryHandler
  implements IQueryHandler<GetSpaceWeatherQuery, WeatherForecast | null>
{
  private readonly logger = new Logger(GetSpaceWeatherQueryHandler.name);

  constructor(
    @Inject(SPACE_READ_REPOSITORY)
    private readonly spaceReadRepository: ISpaceReadRepository,
    @Inject(WEATHER_PORT)
    private readonly weatherPort: IWeatherPort,
  ) {}

  async execute(query: GetSpaceWeatherQuery): Promise<WeatherForecast | null> {
    this.logger.log(`Getting weather for space: ${query.spaceId}`);

    const vm = await this.spaceReadRepository.findById(query.spaceId);

    if (!vm) {
      throw new NotFoundException(`Space not found: ${query.spaceId}`);
    }

    if (vm.latitude == null || vm.longitude == null) {
      this.logger.log(`Space ${query.spaceId} has no geolocation set`);
      return null;
    }

    return this.weatherPort.getForecast(vm.latitude, vm.longitude);
  }
}
