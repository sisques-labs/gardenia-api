# Gardenia API

Backend for Gardenia, a gardening companion application. Exposes REST and GraphQL APIs for managing plants, spaces, care logs, harvests, planting spots, and the planting calendar.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [NestJS 10](https://nestjs.com/) |
| Language | TypeScript (strict) |
| API | GraphQL ([Apollo](https://www.apollographql.com/docs/apollo-server/), code-first) + REST |
| Architecture | CQRS ([`@nestjs/cqrs`](https://docs.nestjs.com/recipes/cqrs)) over DDD + Hexagonal (Screaming Architecture) |
| Database | PostgreSQL via [TypeORM](https://typeorm.io/) + MongoDB |
| Auth | JWT + refresh tokens, OAuth (Google, GitHub, Apple) |
| Tests | [Jest](https://jestjs.io/) (unit, integration, E2E) |
| Observability | OpenTelemetry traces + metrics + logs (optional, all disabled together when `OTEL_EXPORTER_OTLP_ENDPOINT` is unset) |
| Package manager | [pnpm](https://pnpm.io/) |

## Prerequisites

- Node.js 24 (see `.nvmrc`)
- pnpm 9.15.4 (`corepack enable` picks up the pinned version from `package.json`)
- Docker (for local Postgres and integration/E2E test databases)

## Environment setup

Copy the example env file and fill in the values for your local environment:

```bash
cp .env.example .env
```

Key variables (see `.env.example` for the full list with defaults):

| Variable | Purpose |
|----------|---------|
| `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USERNAME` / `DATABASE_PASSWORD` / `DATABASE_DATABASE` | PostgreSQL connection (individual vars — `DATABASE_URL` is not supported) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` / `JWT_EXPIRES_IN` | Access token signing |
| `REFRESH_TOKEN_TTL_DAYS` / `REFRESH_COOKIE_NAME` / `REFRESH_REUSE_GRACE_MS` | Refresh token rotation |
| `OAUTH_TOKEN_ENC_KEY` / `OAUTH_STATE_SECRET` | OAuth token encryption + CSRF state signing |
| `GOOGLE_*` / `GITHUB_*` / `APPLE_*` | Per-provider OAuth credentials |
| `FRONTEND_URL` / `CORS_ORIGINS` | Post-login redirect target and allowed browser origins |
| `QR_BASE_URL` | Base URL used to build plant QR deep links |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces + metrics exported via OTLP; SDK is skipped entirely when unset |

## Getting started

```bash
# Install dependencies
pnpm install

# Start a local Postgres (port 5434, database gardenia_db)
docker compose up -d

# Run pending migrations
pnpm migration:run

# Start the API in watch mode
pnpm dev
```

The API listens on `http://localhost:3000` (REST) and exposes GraphQL at `http://localhost:3000/graphql`.

## Available scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start in watch mode |
| `pnpm start` | Start (no watch) |
| `pnpm debug` | Start with `--debug --watch` |
| `pnpm build` | Compile to `dist/` |
| `pnpm prod` | Run the compiled build (`node dist/main`) |
| `pnpm lint` | ESLint with `--fix` |
| `pnpm format` | Prettier write |
| `pnpm migration:generate` / `migration:create` / `migration:run` / `migration:revert` / `migration:show` | TypeORM migrations |
| `pnpm gen:topics` / `gen:topics:check` | Generate/verify the aggregate→module messaging topic map |

## Architecture

DDD + CQRS + Hexagonal (Screaming Architecture). Each bounded context under `src/contexts/{context}/` is self-contained with four layers:

| Layer | Contains |
|-------|----------|
| `domain/` | Aggregates, value objects, domain events, repository interfaces — no framework imports |
| `application/` | Command/query handlers, assert services — orchestrates domain + ports |
| `infrastructure/` | TypeORM/Mongo repositories, mappers, adapters to other contexts |
| `transport/` | GraphQL resolvers, REST controllers, MCP tools — CommandBus/QueryBus only, no direct service injection |

```
src/
├── contexts/            # Bounded contexts (business domains)
│   ├── auth/
│   ├── care-log/
│   ├── care-schedule/
│   ├── files/
│   ├── harvests/
│   ├── inventory/
│   ├── plant-identification/
│   ├── plant-photos/
│   ├── plant-species/
│   ├── planting-spots/
│   ├── plants/
│   ├── qr/
│   ├── spaces/
│   ├── users/
│   └── weather/
└── core/                 # Cross-cutting infra shared by every context
    ├── config/           # postgres/auth/otel config factories
    ├── filters/          # BaseExceptionFilter
    ├── health/           # Health checks
    ├── mcp/               # MCP context builder (see below)
    ├── messaging/        # Aggregate→module topic mapping
    ├── observability/    # OpenTelemetry CQRS spans+metrics
    └── transport/graphql/ # Shared GraphQL enum registrations
```

A bounded context may only import its own `@contexts/{self}/`. Reaching into another context happens exclusively through `infrastructure/adapters/` (a port implementation dispatching via Command/QueryBus), enforced by an ESLint boundaries rule. See `src/core/README.md` and each context's own `README.md` (e.g. `src/contexts/auth/README.md`) for details, and `.claude/skills/architecture/SKILL.md` for the full layering rules.

Every bounded context also exposes its public commands/queries as [MCP](https://modelcontextprotocol.io/) tools under `transport/mcp/`, served from a single `/api/mcp` endpoint.

## Testing

Three layers — fastest to slowest:

| Layer | Command | DB required | What it covers |
|-------|---------|-------------|----------------|
| Unit | `pnpm test` | No | Domain, handlers, mocked repos |
| Integration | `pnpm test:integration` | Yes | TypeORM repos, tenant scoping |
| API E2E | `pnpm test:e2e` | Yes | Full app, HTTP/GraphQL |

### Database setup (integration + E2E)

Start the test Postgres container (port **5433**, database `gardenia_test`):

```bash
pnpm test:db:up
```

Stop it when done:

```bash
pnpm test:db:down
```

`pretest:integration` and `pretest:e2e` check that Postgres is reachable and print the compose command if not.

**Optional — Testcontainers** (Docker required, no manual `docker compose up`):

```bash
USE_TESTCONTAINERS=1 pnpm test:integration
USE_TESTCONTAINERS=1 pnpm test:e2e
```

Jest starts a disposable Postgres 16 container via `@testcontainers/postgresql` and wires the dynamic port automatically. CI continues to use GitHub Actions Postgres services — Testcontainers is local-only.

### Commands

```bash
# unit tests (runs on pre-push)
pnpm test

# integration tests (repos + handlers, real Postgres)
pnpm test:integration

# API E2E tests (full AppModule + HTTP/GraphQL)
pnpm test:e2e

# coverage (threshold: 80%)
pnpm test:cov
```

## Docker

A 2-stage `Dockerfile` (`node:24-bookworm-slim`) builds with pnpm and runs the compiled output directly (`node dist/main`, no pnpm/npm at runtime). Exposes port `3000`.

```bash
docker build -t gardenia-api .
docker compose up -d   # local Postgres only — the API itself runs via pnpm dev, not this compose file
```

## Contributing

- Base branch: `main`. Feature branches → PR → `main`.
- [Conventional Commits](https://www.conventionalcommits.org/); no AI attribution in commit messages.
- Pre-push hooks (Husky) run unit tests; pre-commit (lint-staged) runs ESLint/Prettier on staged files.
- Releases are automated via `release-train.yml` / `release.yml` (git-cliff generates `CHANGELOG.md`).

## License

[Gardenia Community License 1.0](LICENSE)
