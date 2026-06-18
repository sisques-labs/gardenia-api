# Design: Space Geolocation & Weather

## Why a separate `weather` bounded context

Weather data is an infrastructure concern sourced from an external HTTP API. It has no domain aggregates, no business rules, and no events. Placing it inside `spaces` would pollute the spaces domain with external adapter code and make it harder to share with other contexts (e.g., `planting-spots`).

A dedicated `weather` context with a single port + adapter provides:
- Clear anti-corruption boundary (Open-Meteo response shape never leaks into the domain).
- Swap-ability: replacing Open-Meteo with another provider requires only a new `IWeatherPort` implementation.
- Reusability: any future context can import `WeatherModule` and inject `WEATHER_PORT`.

## `IWeatherPort` pattern

```typescript
export const WEATHER_PORT = Symbol('WEATHER_PORT');

export interface IWeatherPort {
  getForecast(latitude: number, longitude: number): Promise<WeatherForecast>;
}
```

The port lives in `src/contexts/weather/application/ports/weather.port.ts`. The application layer depends only on this interface; the adapter is an implementation detail of the infrastructure layer.

## Caching strategy

`OpenMeteoAdapter` maintains a private `Map<string, { data: WeatherForecast; expiresAt: number }>` keyed by `"${lat},${lon}"`. Before each fetch it checks whether the cached entry is still valid (`Date.now() < expiresAt`). If valid, it returns the cached value. On a cache miss it fetches from Open-Meteo, stores the result with `expiresAt = Date.now() + 3_600_000` (1 hour), and returns the fresh data.

Rationale:
- Open-Meteo daily forecasts update at most a few times per hour; a 1-hour TTL is accurate enough.
- No external cache (Redis) needed — the process is single-instance at this scale.
- Unbounded cache growth is acceptable; at 1 lat/lon per space the map stays tiny.

## Open-Meteo API

Endpoint:
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lon}
  &daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode
  &timezone=auto
  &forecast_days=7
```

No API key required. Response shape (relevant fields):
```json
{
  "latitude": 41.3851,
  "longitude": 2.1734,
  "timezone": "Europe/Madrid",
  "daily": {
    "time": ["2026-06-18", ...],
    "temperature_2m_max": [28.1, ...],
    "temperature_2m_min": [18.4, ...],
    "precipitation_sum": [0.0, ...],
    "weathercode": [1, ...]
  }
}
```

Mapping to `DailyForecast[]`:
```
time[i]              → date
temperature_2m_min[i] → temperatureMin
temperature_2m_max[i] → temperatureMax
precipitation_sum[i]  → precipitationSum
weathercode[i]        → weatherCode
```

`WeatherForecast` also carries top-level `latitude`, `longitude`, `timezone` from the response.

## Domain decision: lat/lon as plain numbers

Latitude and longitude are optional floats with no business invariants enforced beyond range constraints (validated at the transport layer with `@Min`/`@Max`). Wrapping them in custom value objects would add boilerplate without adding domain expressiveness. They are stored as `number | null` fields on the aggregate.

## `SpaceEnvironmentEnum` placement

The enum describes the physical character of a space (indoor greenhouse, outdoor garden, mixed). This is a domain concept owned by the `spaces` bounded context, not a weather concept. It lives in:
```
src/contexts/spaces/domain/enums/space-environment.enum.ts
```
and is registered for GraphQL in the existing enum scaffold file:
```
src/contexts/spaces/transport/graphql/enums/space/space-registered-enums.graphql.ts
```

## `SpaceAggregate.setGeolocation()`

A simple mutator method, no domain event emitted (out of scope for this change):
```typescript
setGeolocation(
  latitude: number | null,
  longitude: number | null,
  environment: SpaceEnvironmentEnum | null,
): void {
  this._latitude = latitude;
  this._longitude = longitude;
  this._environment = environment;
}
```

The aggregate remains valid with all three fields as `null` (pre-geolocation spaces).

## Persistence

Three nullable columns added to `spaces` via a non-destructive migration:

| Column | Type | Notes |
|--------|------|-------|
| `latitude` | `DECIMAL(10,7)` | 7 decimal places ≈ 1 cm precision |
| `longitude` | `DECIMAL(10,7)` | same |
| `environment` | `VARCHAR(10)` | stores enum string value |

TypeORM may return `DECIMAL` columns as strings. The mapper casts with `entity.latitude != null ? Number(entity.latitude) : null`.

## GetSpaceWeatherQuery semantics

1. Load `SpaceViewModel` from `SPACE_READ_REPOSITORY.findById(spaceId)`.
2. If not found, throw `NotFoundException`.
3. If `vm.latitude == null || vm.longitude == null`, return `null` (no geolocation set).
4. Call `weatherPort.getForecast(vm.latitude, vm.longitude)`.
5. Return the `WeatherForecast` (the resolver maps it to `SpaceWeatherResponseDto`).

## UpdateSpaceGeolocationCommand semantics

1. Load `SpaceAggregate` from `SPACE_WRITE_REPOSITORY.findById(spaceId)` (method already exists).
2. If not found, throw `NotFoundException`.
3. Call `space.setGeolocation(latitude, longitude, environment)`.
4. Save via `SPACE_WRITE_REPOSITORY.save(space)`.

## Module wiring

`WeatherModule` exports `{ provide: WEATHER_PORT, useClass: OpenMeteoAdapter }`. `SpacesModule` imports `WeatherModule` so `GetSpaceWeatherQueryHandler` can inject `WEATHER_PORT`. `WeatherModule` does NOT need to be imported by `AppModule` because `SpacesModule` re-exports nothing from it — it is an internal dependency.
