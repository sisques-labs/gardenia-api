import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType('DailyForecastResponseDto')
export class DailyForecastResponseDto {
  @Field(() => String)
  date!: string;

  @Field(() => Float)
  temperatureMin!: number;

  @Field(() => Float)
  temperatureMax!: number;

  @Field(() => Float)
  precipitationSum!: number;

  @Field(() => Int)
  weatherCode!: number;
}

@ObjectType('SpaceWeatherResponseDto')
export class SpaceWeatherResponseDto {
  @Field(() => Float)
  latitude!: number;

  @Field(() => Float)
  longitude!: number;

  @Field(() => String)
  timezone!: string;

  @Field(() => [DailyForecastResponseDto])
  daily!: DailyForecastResponseDto[];
}
