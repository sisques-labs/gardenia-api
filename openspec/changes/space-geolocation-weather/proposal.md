# Proposal: Space Geolocation & Weather

## Intent

### Problem
`SpaceAggregate` has no notion of physical location. Gardenia users who grow plants outdoors (or in mixed indoor/outdoor environments) cannot associate a space with a geographic position, and there is no way to surface weather conditions relevant to that space. This leaves the API without context-aware environmental data that could inform care decisions.

### Why now
The spaces GraphQL transport is complete and stable. Adding geolocation is a small, additive domain change (three nullable fields) that does not alter existing behaviour. The Open-Meteo API is free, requires no API key, and is production-grade — making the weather query low-cost to ship. The feature unblocks higher-level product features (plant care recommendations, environment-aware scheduling) without requiring a paid weather service.

### Success criteria
- `SpaceAggregate` accepts optional `latitude`, `longitude`, and `environment` (INDOOR / OUTDOOR / MIXED).
- A `spaceUpdateGeolocation` mutation lets the space owner set or clear these fields.
- A `spaceWeather(input: { spaceId })` query returns a 7-day daily forecast for the space's location, or `null` if the space has no geolocation.
- Weather data is fetched from Open-Meteo (free, no key) and cached in-memory for ~1 hour per lat/lon pair.
- No changes to the alerts/tasks engine. No FrostAlert, no RainExpected task.

## Scope

### In scope
- `SpaceEnvironmentEnum` (INDOOR, OUTDOOR, MIXED) in the spaces domain.
- Optional `latitude`, `longitude`, `environment` fields on `ISpace`, `ISpacePrimitives`, `SpaceAggregate`, `SpaceViewModel`, `SpaceBuilder`.
- TypeORM `SpaceEntity` columns + DB migration.
- `SpaceTypeOrmMapper` updates (toDomain + toPersistence).
- New `weather` bounded context with `IWeatherPort`, `OpenMeteoAdapter`, `WeatherModule`.
- `GetSpaceWeatherQuery` + handler: returns `null` if no geolocation, otherwise calls `IWeatherPort.getForecast`.
- `UpdateSpaceGeolocationCommand` + handler: loads aggregate via write repo, calls `setGeolocation`, saves.
- GraphQL request/response DTOs, mapper update, resolver additions (`spaceWeather` query + `spaceUpdateGeolocation` mutation).
- `SpacesModule` wiring: import `WeatherModule`, add new query/command handlers.
- `SpaceEnvironmentEnum` registered with `registerEnumType` in the existing enum scaffold file.
- `SpaceResponseDto` extended with optional geolocation fields.

### Out of scope
- FrostAlert domain event.
- RainExpected domain event.
- Tasks engine integration of any kind.
- Push notifications or webhooks driven by weather.
- User-facing weather units preference (always Celsius / mm).
- Persistence of weather data (always fetched live, cached in-memory).
- Any change to the auth, plants, care-log, or harvest contexts.

### Affected files
New (~20):
```
src/contexts/spaces/domain/enums/space-environment.enum.ts
src/contexts/weather/domain/interfaces/weather-forecast.interface.ts
src/contexts/weather/application/ports/weather.port.ts
src/contexts/weather/infrastructure/adapters/open-meteo.adapter.ts
src/contexts/weather/weather.module.ts
src/contexts/spaces/application/queries/get-space-weather/get-space-weather.query.ts
src/contexts/spaces/application/queries/get-space-weather/get-space-weather.handler.ts
src/contexts/spaces/application/commands/update-space-geolocation/update-space-geolocation.command.ts
src/contexts/spaces/application/commands/update-space-geolocation/update-space-geolocation.handler.ts
src/contexts/spaces/transport/graphql/dtos/requests/space/space-weather.request.dto.ts
src/contexts/spaces/transport/graphql/dtos/requests/space/space-update-geolocation.request.dto.ts
src/contexts/spaces/transport/graphql/dtos/responses/space/space-weather.response.dto.ts
src/database/migrations/1750245600000-AddGeolocationToSpaces.ts
```
Modified (~9):
```
src/contexts/spaces/domain/interfaces/space.interface.ts
src/contexts/spaces/domain/primitives/space.primitives.ts
src/contexts/spaces/domain/aggregates/space.aggregate.ts
src/contexts/spaces/domain/view-models/space.view-model.ts
src/contexts/spaces/domain/builders/space.builder.ts
src/contexts/spaces/infrastructure/persistence/typeorm/entities/space.entity.ts
src/contexts/spaces/infrastructure/persistence/typeorm/mappers/space-typeorm.mapper.ts
src/contexts/spaces/transport/graphql/dtos/responses/space/space.response.dto.ts
src/contexts/spaces/transport/graphql/mappers/space/space.mapper.ts
src/contexts/spaces/transport/graphql/resolvers/space/space-queries.resolver.ts
src/contexts/spaces/transport/graphql/resolvers/space/space-mutations.resolver.ts
src/contexts/spaces/transport/graphql/enums/space/space-registered-enums.graphql.ts
src/contexts/spaces/spaces.module.ts
```

## Approach

### Architecture decision: separate `weather` context
Weather is an external infrastructure concern that has no business rules of its own. Placing `IWeatherPort` in a dedicated `weather` context keeps the `spaces` domain pure and allows other contexts (e.g., `planting-spots`) to reuse it in the future without cross-context coupling.

### Operation mapping
- `spaceWeather(input: { spaceId })` → `GetSpaceWeatherQuery(spaceId)` → reads space view model, delegates to `IWeatherPort.getForecast(lat, lon)` → `SpaceWeatherResponseDto | null`.
- `spaceUpdateGeolocation(input: { spaceId, latitude?, longitude?, environment? })` → `UpdateSpaceGeolocationCommand` → loads `SpaceAggregate` from write repo, calls `setGeolocation(lat, lon, env)`, saves → `MutationResponseDto`.

### Key design choices
1. **Nullable geolocation, not required.** Spaces that were created before this feature have no location; the fields are nullable at every layer.
2. **`SpaceEnvironmentEnum` in the spaces domain, not the weather context.** Environment describes the space's physical character, not a weather concept.
3. **No value objects for lat/lon.** They are plain optional floats; adding VOs would add churn with no domain-rule benefit at this scope.
4. **1-hour in-memory cache in `OpenMeteoAdapter`.** A simple `Map<string, { data, expiresAt }>` keyed by `"lat,lon"` avoids redundant HTTP calls without introducing Redis or any external cache dependency.
5. **`spaceUpdateGeolocation` uses the write repository `findById`.** The write repo already exposes `findById`; no new persistence method is needed.

## Open questions
1. Should setting `latitude` and `longitude` independently be allowed, or must they always be set together? (Recommended: always set together or both null.)
2. Should the mutation enforce that `environment` is always provided when geolocation is set? (Recommended: no — keep all three fields independently nullable.)

## Risks
1. **Open-Meteo downtime.** The adapter has no retry logic. If Open-Meteo is unavailable, the query returns an HTTP error. Mitigation: catch fetch errors and return `null` or rethrow as a NestJS service exception.
2. **Decimal precision in TypeORM.** `DECIMAL(10,7)` columns are returned as strings by some drivers. Mitigation: parse to `Number()` in the mapper.
3. **`SpaceEnvironmentEnum` not registered for GraphQL.** Mitigation: add `registerEnumType` call to the existing enum scaffold file.
4. **Cache memory leak.** Unbounded cache growth if many unique coordinates are queried. Mitigation: acceptable at current scale; TTL eviction on read keeps stale entries from accumulating.

## Estimated effort
- **Lines added:** ~450–520 (13 new files, ~9 modified).
- **PR complexity:** Medium. Domain change + new context + transport additions, but no breaking changes.
- **Migrations:** 1 non-destructive `ALTER TABLE` migration.

## Dependencies
- `spaces` application and transport layers — already complete and stable.
- `@sisques-labs/nestjs-kit` — `BaseAggregate`, `BaseViewModel`, `BaseBuilder`, `MutationResponseDto`, `MutationResponseGraphQLMapper` already present.
- Open-Meteo public API — no key required, free tier, CORS-safe from server.
