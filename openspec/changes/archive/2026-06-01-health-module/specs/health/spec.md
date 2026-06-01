# Health Module Specification

## Purpose

Defines the liveness probe endpoint for Gardenia API. Enables orchestrators, load balancers, and uptime monitors to verify the service is alive without authentication.

## Requirements

### Requirement: Liveness Endpoint

The system MUST expose `GET /api/health` as a public liveness probe.

The endpoint MUST return HTTP 200 with a JSON body containing `status: 'ok'` and a `timestamp` reflecting the time of the request as an ISO 8601 string.

The endpoint MUST NOT require a JWT token or an `X-Space-ID` header.

The `@SkipSpace()` decorator MUST be present on the controller so that both `OptionalJwtAuthGuard` and `SpaceGuard` bypass the route.

The controller MUST reside under `src/core/health/` — not under `src/contexts/`.

No external dependencies (e.g. `@nestjs/terminus`) SHALL be introduced for this endpoint.

#### Scenario: Liveness check — unauthenticated request succeeds

- GIVEN the API is running
- WHEN an unauthenticated client sends `GET /api/health` with no `Authorization` header
- THEN the response status is `200 OK`
- AND the body is `{ "status": "ok", "timestamp": "<ISO8601>" }`

#### Scenario: No X-Space-ID header — request still succeeds

- GIVEN the API is running
- WHEN a client sends `GET /api/health` with no `X-Space-ID` header
- THEN the response status is `200 OK`
- AND the body contains `status: 'ok'`

#### Scenario: Response shape — timestamp is a valid ISO 8601 string

- GIVEN the API is running
- WHEN a client sends `GET /api/health`
- THEN the response body `status` field equals the string `'ok'`
- AND the response body `timestamp` field is a valid ISO 8601 datetime string
- AND `timestamp` reflects the time of the request (not a hardcoded value)
