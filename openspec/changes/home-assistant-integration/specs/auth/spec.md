# Auth — Long-Lived API Tokens Specification

## Purpose

Adds long-lived, space-scoped API tokens to the `auth` context so non-interactive
clients (notably Home Assistant's MCP/Assist client) can authenticate against the
existing guard chain without refreshing a JWT. This is the voice plane of the Home
Assistant integration; it is independent of the MQTT data plane.

---

## Requirements

### Requirement: API Token Issuance

An authenticated user MUST be able to issue an API token scoped to a single space.
Issuance MUST return the plaintext token exactly once; the system MUST NOT be able
to reveal the plaintext again afterward. The token MUST carry a human-readable
prefix so it is recognizable and secret-scanner friendly.

#### Scenario: Token issued once
- GIVEN an authenticated user and a space they belong to
- WHEN they issue an API token
- THEN the response MUST include the plaintext token exactly once
- AND subsequent reads of that token MUST NOT expose the plaintext

---

### Requirement: API Token Persistence and Hashing

The system MUST persist API tokens with the secret stored only as a hash (never in
plaintext), together with the owning `user_id`, the scoped `space_id`, a `label`,
a `last_used_at`, and a `revoked_at`. The `api_tokens` table MUST be created via a
named migration and the token hash MUST be unique.

#### Scenario: Secret is never stored in plaintext
- GIVEN an issued API token
- WHEN the `api_tokens` row is inspected
- THEN it MUST contain a hash of the secret
- AND it MUST NOT contain the plaintext secret

---

### Requirement: API Token Revocation and Listing

A user MUST be able to list their own API tokens (without secrets) and revoke any
of them. A revoked token MUST be rejected for authentication from that point on.

#### Scenario: Revoked token stops working
- GIVEN a valid API token
- WHEN the owner revokes it
- THEN any subsequent request authenticated with that token MUST be rejected

---

### Requirement: API Token Authentication

`Authorization: Bearer <api_token>` MUST authenticate a request and populate the
same request user and space that a JWT would, by hash-looking-up the token and
resolving its `user_id` and `space_id`. An unknown, malformed, or revoked token
MUST result in an unauthenticated request. The raw token MUST never be logged.

#### Scenario: Valid token authenticates and scopes the space
- GIVEN a valid, non-revoked API token scoped to space `S`
- WHEN a request is sent with `Authorization: Bearer <token>`
- THEN the request MUST be authenticated as the token's user
- AND the resolved space MUST be `S`

#### Scenario: Invalid token is unauthenticated
- GIVEN a malformed or revoked token value
- WHEN a request is sent with it
- THEN the request MUST NOT be authenticated
- AND the raw token value MUST NOT appear in logs

---

### Requirement: MCP Endpoint Accepts API Tokens

The existing `POST /api/mcp` endpoint MUST accept a long-lived API token in place
of a JWT, so an MCP client can run the already-exposed tools within the token's
space without a refresh flow.

#### Scenario: MCP tool runs with an API token
- GIVEN a valid API token scoped to space `S`
- WHEN an MCP client calls `POST /api/mcp` with that token and invokes a tool
- THEN the tool MUST execute within space `S` exactly as it would for a JWT-authenticated request
