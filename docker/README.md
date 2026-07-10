# Gardenia API

Backend for Gardenia — a gardening companion that keeps your green spaces
organized, shared, and easy to look after. DDD + CQRS + Hexagonal
architecture on NestJS, TypeORM/PostgreSQL, JWT + OAuth (Google/GitHub/Apple)
auth with multi-tenant spaces, optional Kafka event forwarding, REST
(Swagger) + GraphQL (Apollo) transports, Prometheus metrics, and an MCP
endpoint.

## Quick start

```bash
# OAUTH_TOKEN_ENC_KEY must be a 32-byte base64 key, e.g. `openssl rand -base64 32`
docker run -p 3000:3000 \
  -e DATABASE_HOST=host.docker.internal \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USERNAME=gardenia \
  -e DATABASE_PASSWORD=secret \
  -e DATABASE_DATABASE=gardenia_db \
  -e JWT_SECRET=change_me_in_production \
  -e OAUTH_TOKEN_ENC_KEY=change_me_in_production \
  -e OAUTH_STATE_SECRET=change_me_in_production \
  sisqueslabs/gardenia-api:latest
```

The container needs a reachable PostgreSQL instance — it does not bundle one.

## Ports

| Port | Purpose |
|------|---------|
| `3000` | HTTP — REST (`/api/*`), GraphQL (`/graphql`), Swagger docs, health, metrics, MCP (see routes below) |

## Routes

| Path | Purpose |
|------|---------|
| `GET /api/health/live` | Liveness probe |
| `GET /api/health/ready` | Readiness probe (checks DB connectivity) |
| `GET /api/metrics` | Prometheus metrics (public, not auth-gated) |
| `POST /api/mcp` | MCP (Model Context Protocol) endpoint — auth required, exposes every bounded context's commands/queries as tools |
| `POST /graphql` | GraphQL (Apollo) |
| `GET /docs` | Swagger UI |

## Environment variables

| Variable | Default | Required | Notes |
|----------|---------|----------|-------|
| `PORT` | `3000` | No | HTTP port |
| `NODE_ENV` | `production` | No | |
| `DATABASE_DRIVER` | `postgres` | No | Only `postgres` is supported |
| `DATABASE_HOST` | — | **Yes** | |
| `DATABASE_PORT` | `5432` | No | |
| `DATABASE_USERNAME` | — | **Yes** | |
| `DATABASE_PASSWORD` | — | **Yes** | |
| `DATABASE_DATABASE` | — | **Yes** | |
| `JWT_SECRET` | — | **Yes** | Signs access tokens |
| `JWT_EXPIRES_IN` | `7d` | No | |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | No | |
| `OAUTH_TOKEN_ENC_KEY` | — | **Yes** | 32-byte base64 key (AES-256-GCM) encrypting stored OAuth provider tokens |
| `OAUTH_STATE_SECRET` | — | **Yes** | Signs the OAuth state JWT (CSRF protection) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | — | Only if Google sign-in is used | |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` / `GITHUB_CALLBACK_URL` | — | Only if GitHub sign-in is used | |
| `APPLE_CLIENT_ID` / `APPLE_TEAM_ID` / `APPLE_KEY_ID` / `APPLE_PRIVATE_KEY` / `APPLE_CALLBACK_URL` | — | Only if Sign in with Apple is used | |
| `QR_BASE_URL` | `http://localhost:3000` | No | Base URL embedded in plant QR deep links |
| `CORS_ORIGINS` | — | Production only | Comma-separated allowed origins |
| `SENTRY_DSN` | — | No | Sentry error reporting disabled when unset |
| `KAFKA_ENABLED` | `false` | No | Domain event forwarding; app boots fine without a broker when disabled |
| `KAFKA_BROKERS` | — | If Kafka enabled | Comma-separated broker list |
| `FILES_STORAGE_DRIVER` | `database` | No | `database` or `s3`; S3 vars only required when set to `s3` |

See the project's `.env.example` for the full list, including per-provider
OAuth variables and S3 file-storage settings.

## Tags

- `latest` — most recent stable release (`main` branch)
- `x.y.z` — specific stable release
- `x.y.z-alpha.n` / `-beta.n` / `-rc.n` — prereleases from `develop`/`staging`

## Source

https://github.com/sisques-labs/gardenia-api
