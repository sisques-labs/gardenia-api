# Tasks: Space Geolocation & Weather

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 450–520 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All files (domain + persistence + weather context + application + transport + wiring) | PR 1 | Atomic feature slice; additive only |

---

## Phase 1: Domain changes

- [ ] T1 — Create `src/contexts/spaces/domain/enums/space-environment.enum.ts` — `SpaceEnvironmentEnum` with `INDOOR`, `OUTDOOR`, `MIXED` string values.
- [ ] T2 — Modify `src/contexts/spaces/domain/interfaces/space.interface.ts` — add optional `latitude?: number | null`, `longitude?: number | null`, `environment?: SpaceEnvironmentEnum | null`.
- [ ] T3 — Modify `src/contexts/spaces/domain/primitives/space.primitives.ts` — add `latitude: number | null`, `longitude: number | null`, `environment: SpaceEnvironmentEnum | null` to `ISpacePrimitives`.
- [ ] T4 — Modify `src/contexts/spaces/domain/aggregates/space.aggregate.ts` — add private fields, constructor reads from props, add getters, add `setGeolocation()` mutator, update `toPrimitives()`.
- [ ] T5 — Modify `src/contexts/spaces/domain/view-models/space.view-model.ts` — add `latitude`, `longitude`, `environment` public readonly fields from `ISpacePrimitives`.
- [ ] T6 — Modify `src/contexts/spaces/domain/builders/space.builder.ts` — add `withLatitude`, `withLongitude`, `withEnvironment` chainable methods; pass fields to `SpaceAggregate` constructor and `SpaceViewModel` constructor.

## Phase 2: Persistence

- [ ] T7 — Modify `src/contexts/spaces/infrastructure/persistence/typeorm/entities/space.entity.ts` — add `latitude`, `longitude` (`DECIMAL 10,7`, nullable), `environment` (`VARCHAR 10`, nullable) columns.
- [ ] T8 — Modify `src/contexts/spaces/infrastructure/persistence/typeorm/mappers/space-typeorm.mapper.ts` — update `toDomain` to call `withLatitude`/`withLongitude`/`withEnvironment` with null-safe `Number()` cast for decimals; update `toPersistence` to include the three fields.
- [ ] T9 — Create `src/database/migrations/1750245600000-AddGeolocationToSpaces.ts` — `ADD COLUMN IF NOT EXISTS` for `latitude`, `longitude`, `environment`; down method drops them.

## Phase 3: Weather context

- [ ] T10 — Create `src/contexts/weather/domain/interfaces/weather-forecast.interface.ts` — `DailyForecast` and `WeatherForecast` interfaces.
- [ ] T11 — Create `src/contexts/weather/application/ports/weather.port.ts` — `WEATHER_PORT` symbol + `IWeatherPort` interface with `getForecast(lat, lon): Promise<WeatherForecast>`.
- [ ] T12 — Create `src/contexts/weather/infrastructure/adapters/open-meteo.adapter.ts` — `OpenMeteoAdapter` implements `IWeatherPort`; uses native `fetch`; in-memory Map cache with 1 h TTL; maps Open-Meteo response to `WeatherForecast`.
- [ ] T13 — Create `src/contexts/weather/weather.module.ts` — `WeatherModule` providing `{ provide: WEATHER_PORT, useClass: OpenMeteoAdapter }` and exporting it.

## Phase 4: Application layer

- [ ] T14 — Create `src/contexts/spaces/application/queries/get-space-weather/get-space-weather.query.ts` — `GetSpaceWeatherQuery` with `spaceId: string`.
- [ ] T15 — Create `src/contexts/spaces/application/queries/get-space-weather/get-space-weather.handler.ts` — `@QueryHandler(GetSpaceWeatherQuery)` injecting `SPACE_READ_REPOSITORY` and `WEATHER_PORT`; returns `WeatherForecast | null`.
- [ ] T16 — Create `src/contexts/spaces/application/commands/update-space-geolocation/update-space-geolocation.command.ts` — `UpdateSpaceGeolocationCommand` with `spaceId`, `latitude`, `longitude`, `environment`, `requestingUserId`.
- [ ] T17 — Create `src/contexts/spaces/application/commands/update-space-geolocation/update-space-geolocation.handler.ts` — `@CommandHandler` injecting `SPACE_WRITE_REPOSITORY`; loads aggregate, calls `setGeolocation`, saves.

## Phase 5: GraphQL transport

- [ ] T18 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-weather.request.dto.ts` — `SpaceWeatherRequestDto` with `spaceId` (`@IsUUID`).
- [ ] T19 — Create `src/contexts/spaces/transport/graphql/dtos/requests/space/space-update-geolocation.request.dto.ts` — `SpaceUpdateGeolocationRequestDto` with `spaceId`, optional `latitude`, `longitude`, `environment`.
- [ ] T20 — Create `src/contexts/spaces/transport/graphql/dtos/responses/space/space-weather.response.dto.ts` — `DailyForecastResponseDto` + `SpaceWeatherResponseDto`.
- [ ] T21 — Modify `src/contexts/spaces/transport/graphql/dtos/responses/space/space.response.dto.ts` — add optional `latitude`, `longitude`, `environment` fields.
- [ ] T22 — Modify `src/contexts/spaces/transport/graphql/mappers/space/space.mapper.ts` — include `latitude`, `longitude`, `environment` in `toResponseDtoFromViewModel`.
- [ ] T23 — Modify `src/contexts/spaces/transport/graphql/resolvers/space/space-queries.resolver.ts` — add `spaceWeather(@Args('input') input: SpaceWeatherRequestDto)` query.
- [ ] T24 — Modify `src/contexts/spaces/transport/graphql/resolvers/space/space-mutations.resolver.ts` — add `spaceUpdateGeolocation(@CurrentUser user, @Args('input') input: SpaceUpdateGeolocationRequestDto)` mutation.
- [ ] T25 — Modify `src/contexts/spaces/transport/graphql/enums/space/space-registered-enums.graphql.ts` — add `registerEnumType(SpaceEnvironmentEnum, { name: 'SpaceEnvironmentEnum' })`.

## Phase 6: Module wiring

- [ ] T26 — Modify `src/contexts/spaces/spaces.module.ts` — import `WeatherModule`; add `GetSpaceWeatherQueryHandler` to `QUERY_HANDLERS`; add `UpdateSpaceGeolocationCommandHandler` to `COMMAND_HANDLERS`.
