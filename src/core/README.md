# Core Module

## Purpose

The `core` directory provides cross-cutting infrastructure that all contexts depend on. It does NOT belong to any bounded context. It owns: database connection configuration, JWT/auth configuration, the global exception filter, and GraphQL enum registrations shared across contexts. Nothing in `core` knows about `auth` or `users` business logic.

---

## What Core Provides to Other Modules

Every module in the application benefits from what `core` exposes, loaded at bootstrap via `AppModule`:

- **`postgresConfig`** — a `ConfigModule`-registered factory that reads database env vars and returns `TypeOrmModuleOptions`. Consumed by the test bootstrap to override DB settings.
- **`authConfig`** — a `ConfigModule`-registered factory that exposes `JWT_SECRET` and `JWT_EXPIRES_IN` under the `'auth'` namespace. Consumed by `AuthModule`'s `JwtModule.registerAsync`.
- **`BaseExceptionFilter`** — a global NestJS `ExceptionFilter` that catches `BaseException` subclasses and maps them to HTTP status codes, or re-throws them for Apollo to format in GraphQL responses.
- **`ObservabilityModule`** — registers Sentry (`SentryModule.forRoot()` and `SentryGlobalFilter`) for unhandled error reporting, tracing, and profiling. Sentry is disabled when `SENTRY_DSN` is unset.
- **GraphQL enum registrations** — `FilterOperator` and `SortDirection` from `@sisques-labs/nestjs-kit` are registered with the GraphQL schema so that criteria-based queries work correctly.

---

## Architecture Layers

| Layer | Path | What lives here |
|-------|------|-----------------|
| **config** | `config/` | `postgresConfig` factory (`postgres.config.ts`), `authConfig` factory (`auth.config.ts`), `sentryConfig` factory (`sentry.config.ts`) |
| **filters** | `filters/` | `BaseExceptionFilter` — catches `BaseException`, maps to HTTP status codes |
| **observability** | `observability/` | `ObservabilityModule` — Sentry error monitoring, tracing, and profiling |
| **transport/graphql** | `transport/graphql/` | `registered-enums.graphql.ts` — registers shared GraphQL enums at startup |

---

## Exported Services / Filters / Configs

### `postgresConfig`

Registered under the `'postgres'` namespace via `ConfigModule.forRoot({ load: [postgresConfig] })` in `AppModule`.

Reads the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_DRIVER` | `postgres` | TypeORM driver type |
| `DATABASE_HOST` | — | Postgres host |
| `DATABASE_PORT` | `5432` | Postgres port |
| `DATABASE_USERNAME` | — | Postgres username |
| `DATABASE_PASSWORD` | — | Postgres password |
| `DATABASE_DATABASE` | — | Postgres database name |

`synchronize` is always `false` in production. `autoLoadEntities` is `true` so modules only need to call `TypeOrmModule.forFeature([Entity])`.

### `authConfig`

Registered under the `'auth'` namespace. Reads:

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | — | Secret key used to sign JWT tokens |
| `JWT_EXPIRES_IN` | `1d` | JWT expiry duration (e.g. `1d`, `7d`, `3600`) |

### `sentryConfig`

Registered under the `'sentry'` namespace. Sentry is **optional** — when `SENTRY_DSN` is unset, `instrument.ts` skips `Sentry.init()` and the API starts normally.

| Variable | Default | Description |
|----------|---------|-------------|
| `SENTRY_DSN` | — | Sentry project DSN; SDK disabled when unset |
| `SENTRY_ENVIRONMENT` | `NODE_ENV` or `development` | Environment tag in Sentry |
| `SENTRY_RELEASE` | — | Release identifier (e.g. git SHA) |
| `SENTRY_TRACES_SAMPLE_RATE` | `1.0` | Transaction sample rate (0–1) |
| `SENTRY_PROFILE_SESSION_SAMPLE_RATE` | `1.0` | Profiling session sample rate (0–1) |

Initialization happens in `src/instrument.ts` (imported first in `main.ts`) before NestJS boots. `ObservabilityModule` wires `SentryGlobalFilter` for unhandled exceptions; domain `BaseException` errors are handled separately and are not reported to Sentry.

### `BaseExceptionFilter`

Catches any `BaseException` (from `@sisques-labs/nestjs-kit`) thrown anywhere in the application and converts it to an appropriate HTTP response or GraphQL error.

**HTTP status mapping table:**

| Exception class | HTTP status |
|-----------------|-------------|
| `UserAlreadyExistsException` | 409 Conflict |
| `UserNotFoundException` | 404 Not Found |
| `InvalidCredentialsException` | 401 Unauthorized |
| Any other `BaseException` subclass | 400 Bad Request |

For **REST** requests: sends a JSON response `{ statusCode, message, error }`.

For **GraphQL** requests: re-throws the exception with `statusCode` attached as metadata so Apollo formats it in the `errors` array.

Registered globally in `src/main.ts`:

```ts
app.useGlobalFilters(new BaseExceptionFilter());
```

### GraphQL Enum Registrations

`src/core/transport/graphql/registered-enums.graphql.ts` calls `registerEnumType` at module load time for:

| Enum | GraphQL name | Purpose |
|------|-------------|---------|
| `FilterOperator` | `FilterOperator` | Used in criteria filter inputs (e.g. `EQ`, `LIKE`, `IN`) |
| `SortDirection` | `SortDirection` | Used in criteria sort inputs (`ASC`, `DESC`) |

These enums come from `@sisques-labs/nestjs-kit` and must be registered before any schema-building happens. The import is a side-effect import in `AppModule`.

---

## How to Test This Module

**Unit tests** (no database, no HTTP):

```bash
pnpm test src/core
```

Spec files:
- `src/core/filters/base-exception.filter.spec.ts` — verifies all exception-to-status-code mappings with a stubbed `ArgumentsHost`.
- `src/core/config/postgres.config.spec.ts` — verifies the factory returns expected TypeORM options.

---

## Configuration & Dependencies

### `@sisques-labs/nestjs-kit` base classes used

| Class | Used by |
|-------|---------|
| `BaseException` | `BaseExceptionFilter` catches it |
| `FilterOperator`, `SortDirection` | Registered as GraphQL enums |
| `SharedGraphQLModule` | Imported in `AppModule`; provides shared GraphQL infrastructure |

### External NestJS packages

- `@nestjs/config` — `registerAs`, `ConfigModule`
- `@nestjs/typeorm` — `TypeOrmModuleOptions` type
- `@nestjs/graphql` — `registerEnumType`
