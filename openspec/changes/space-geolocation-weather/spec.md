# Spec: Space Geolocation & Weather

## File structure

### New files

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

### Modified files

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

---

## `SpaceEnvironmentEnum`

```typescript
export enum SpaceEnvironmentEnum {
  INDOOR  = 'INDOOR',
  OUTDOOR = 'OUTDOOR',
  MIXED   = 'MIXED',
}
```

Registered for GraphQL as `'SpaceEnvironmentEnum'` via `registerEnumType`.

---

## Domain interfaces

### `ISpace` additions
```typescript
latitude?:    number | null;
longitude?:   number | null;
environment?: SpaceEnvironmentEnum | null;
```

### `ISpacePrimitives` additions
```typescript
latitude:    number | null;
longitude:   number | null;
environment: SpaceEnvironmentEnum | null;
```

---

## `SpaceAggregate` additions

- Private fields: `_latitude: number | null`, `_longitude: number | null`, `_environment: SpaceEnvironmentEnum | null`.
- Constructor reads from `props.latitude ?? null`, etc.
- Getters: `get latitude()`, `get longitude()`, `get environment()`.
- Method: `setGeolocation(latitude, longitude, environment)` — plain setter, no event.
- `toPrimitives()` includes `latitude`, `longitude`, `environment`.

---

## `SpaceViewModel` additions

```typescript
public readonly latitude:    number | null;
public readonly longitude:   number | null;
public readonly environment: SpaceEnvironmentEnum | null;
```

Set from `ISpacePrimitives` in the constructor.

---

## `SpaceBuilder` additions

```typescript
private _latitude:    number | null = null;
private _longitude:   number | null = null;
private _environment: SpaceEnvironmentEnum | null = null;

withLatitude(v: number | null):               this { ... }
withLongitude(v: number | null):              this { ... }
withEnvironment(v: SpaceEnvironmentEnum | null): this { ... }
```

Passed to `SpaceAggregate` constructor and to `SpaceViewModel` constructor.

---

## Persistence

### `SpaceEntity` additions
```typescript
@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
latitude!: number | null;

@Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
longitude!: number | null;

@Column({ name: 'environment', type: 'varchar', length: 10, nullable: true })
environment!: string | null;
```

### `SpaceTypeOrmMapper` updates
- `toDomain`: call `.withLatitude(entity.latitude != null ? Number(entity.latitude) : null)`, `.withLongitude(...)`, `.withEnvironment(entity.environment as SpaceEnvironmentEnum | null)`.
- `toPersistence`: set `entity.latitude = primitives.latitude`, `entity.longitude = primitives.longitude`, `entity.environment = primitives.environment`.

### Migration
File: `src/database/migrations/1750245600000-AddGeolocationToSpaces.ts`
```sql
-- up
ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "latitude"    DECIMAL(10,7) NULL;
ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "longitude"   DECIMAL(10,7) NULL;
ALTER TABLE "spaces" ADD COLUMN IF NOT EXISTS "environment" VARCHAR(10)   NULL;

-- down
ALTER TABLE "spaces" DROP COLUMN IF EXISTS "environment";
ALTER TABLE "spaces" DROP COLUMN IF EXISTS "longitude";
ALTER TABLE "spaces" DROP COLUMN IF EXISTS "latitude";
```

---

## `IWeatherPort` contract

```typescript
export const WEATHER_PORT = Symbol('WEATHER_PORT');

export interface IWeatherPort {
  getForecast(latitude: number, longitude: number): Promise<WeatherForecast>;
}
```

---

## `WeatherForecast` & `DailyForecast` interfaces

```typescript
export interface DailyForecast {
  date:             string;
  temperatureMin:   number;
  temperatureMax:   number;
  precipitationSum: number;
  weatherCode:      number;
}

export interface WeatherForecast {
  latitude:  number;
  longitude: number;
  timezone:  string;
  daily:     DailyForecast[];
}
```

---

## `OpenMeteoAdapter` behaviour

- URL: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=auto&forecast_days=7`
- Uses native `fetch` (Node 18+). No API key.
- Cache: `Map<string, { data: WeatherForecast; expiresAt: number }>` keyed by `"${lat},${lon}"`. TTL = 3 600 000 ms (1 h).
- Returns cached data if `Date.now() < expiresAt`.
- On network/parse error: exception propagates to caller.

---

## `GetSpaceWeatherQuery` semantics

```
Input:  spaceId: string
Output: WeatherForecast | null

1. Read SpaceViewModel via SPACE_READ_REPOSITORY.findById(spaceId)
2. If null  → throw NotFoundException
3. If vm.latitude == null || vm.longitude == null → return null
4. return weatherPort.getForecast(vm.latitude, vm.longitude)
```

---

## `UpdateSpaceGeolocationCommand` semantics

```
Input:  spaceId, latitude: number|null, longitude: number|null, environment: SpaceEnvironmentEnum|null, requestingUserId: string
Output: void

1. Load SpaceAggregate via SPACE_WRITE_REPOSITORY.findById(spaceId)
2. If null → throw NotFoundException
3. space.setGeolocation(latitude, longitude, environment)
4. SPACE_WRITE_REPOSITORY.save(space)
```

---

## GraphQL operations

### `spaceWeather` query

```graphql
query {
  spaceWeather(input: { spaceId: "<uuid>" }) {
    latitude
    longitude
    timezone
    daily {
      date
      temperatureMin
      temperatureMax
      precipitationSum
      weatherCode
    }
  }
}
```

- Returns `SpaceWeatherResponseDto | null`.
- Protected with `@UseGuards(JwtAuthGuard)`.

### `spaceUpdateGeolocation` mutation

```graphql
mutation {
  spaceUpdateGeolocation(input: {
    spaceId:     "<uuid>"
    latitude:    41.3851
    longitude:   2.1734
    environment: OUTDOOR
  }) {
    success
    message
    id
  }
}
```

- Returns `MutationResponseDto`.
- Protected with `@UseGuards(JwtAuthGuard)` (class-level guard on `SpaceMutationsResolver`).

---

## DTO shapes

### `SpaceWeatherRequestDto`
```typescript
@InputType('SpaceWeatherRequestDto')
export class SpaceWeatherRequestDto {
  @Field(() => String) @IsUUID() @IsNotEmpty() spaceId!: string;
}
```

### `SpaceUpdateGeolocationRequestDto`
```typescript
@InputType('SpaceUpdateGeolocationRequestDto')
export class SpaceUpdateGeolocationRequestDto {
  @Field(() => String)  @IsUUID() @IsNotEmpty()                          spaceId!: string;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-90)  @Max(90)   latitude?:    number;
  @Field(() => Float, { nullable: true }) @IsOptional() @IsNumber() @Min(-180) @Max(180)  longitude?:   number;
  @Field(() => SpaceEnvironmentEnum, { nullable: true }) @IsOptional() @IsEnum(SpaceEnvironmentEnum) environment?: SpaceEnvironmentEnum;
}
```

### `DailyForecastResponseDto` & `SpaceWeatherResponseDto`
```typescript
@ObjectType('DailyForecastResponseDto')
export class DailyForecastResponseDto {
  @Field(() => String)  date!:             string;
  @Field(() => Float)   temperatureMin!:   number;
  @Field(() => Float)   temperatureMax!:   number;
  @Field(() => Float)   precipitationSum!: number;
  @Field(() => Int)     weatherCode!:      number;
}

@ObjectType('SpaceWeatherResponseDto')
export class SpaceWeatherResponseDto {
  @Field(() => Float)                    latitude!:  number;
  @Field(() => Float)                    longitude!: number;
  @Field(() => String)                   timezone!:  string;
  @Field(() => [DailyForecastResponseDto]) daily!:   DailyForecastResponseDto[];
}
```

### `SpaceResponseDto` additions
```typescript
@Field(() => Float,  { nullable: true }) latitude?:    number | null;
@Field(() => Float,  { nullable: true }) longitude?:   number | null;
@Field(() => String, { nullable: true }) environment?: string | null;
```

---

## Acceptance scenarios

### Scenario 1: Query weather for a space with geolocation
```
Given  a space with latitude=41.3851, longitude=2.1734
When   spaceWeather(input: { spaceId }) is executed
Then   a 7-day WeatherForecast is returned with non-null daily array
```

### Scenario 2: Query weather for a space without geolocation
```
Given  a space with latitude=null, longitude=null
When   spaceWeather(input: { spaceId }) is executed
Then   null is returned
```

### Scenario 3: Update geolocation successfully
```
Given  an existing space
When   spaceUpdateGeolocation(input: { spaceId, latitude, longitude, environment: OUTDOOR }) is executed
Then   the space is saved with the new geolocation fields
```

### Scenario 4: Update geolocation clears fields
```
Given  a space with geolocation set
When   spaceUpdateGeolocation(input: { spaceId, latitude: null, longitude: null, environment: null }) is executed
Then   the space is saved with null geolocation fields
```

### Scenario 5: Query weather for unknown space
```
Given  a spaceId that does not exist
When   spaceWeather(input: { spaceId }) is executed
Then   NotFoundException is thrown
```

---

## Constraints and invariants

- `latitude` must be in `[-90, 90]` (validated at transport layer).
- `longitude` must be in `[-180, 180]` (validated at transport layer).
- `environment` must be one of `INDOOR`, `OUTDOOR`, `MIXED`.
- All three fields are independently nullable.
- Weather cache TTL is exactly 1 hour per unique `lat,lon` pair.
- Weather is never persisted; it is always fetched from Open-Meteo (possibly from cache).
- `setGeolocation` emits no domain event in this scope.
