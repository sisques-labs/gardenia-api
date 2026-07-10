# Spec: Plant Species Search (GBIF live passthrough)

**Change**: `gbif-species-search`
**Issue**: GDN-35
**Base spec**: none — new bounded context

---

## ADDED Requirements

### Requirement: GbifSpeciesSearch Query

The system MUST expose a `GbifSpeciesSearchQuery` accepting `name` (required,
non-empty string) and `limit` (optional integer, default 10, clamped to a
maximum of 20).

The handler MUST dispatch to `IGbifSpeciesSearchPort.suggest(name, limit)` and
return its result unmodified as a list of
`{ gbifKey: number; scientificName: string }`.

The system MUST NOT persist, cache, or store the query input or its result
anywhere (no database write, no in-memory TTL cache, no Redis).

#### Scenario: Search returns live GBIF matches

- GIVEN GBIF's `/species/suggest` returns matches for "Monstera"
- WHEN `GbifSpeciesSearchQuery` is dispatched with `name: "Monstera"`
- THEN a list of `{ gbifKey, scientificName }` entries is returned, sourced
  entirely from the live GBIF response

#### Scenario: No matches

- GIVEN GBIF's `/species/suggest` returns no matches for a nonsense query
- WHEN `GbifSpeciesSearchQuery` is dispatched
- THEN an empty list is returned (not an error)

#### Scenario: Limit is clamped

- GIVEN a request with `limit: 500`
- WHEN `GbifSpeciesSearchQuery` is dispatched
- THEN at most 20 results are requested from GBIF

---

### Requirement: GBIF Suggest Adapter Resilience

`GbifSpeciesSuggestAdapter` MUST call `GET
https://api.gbif.org/v1/species/suggest` with a request timeout (5s, matching
this repo's existing GBIF-adapter convention).

On any failure — timeout, network error, non-2xx response, or malformed
payload — the adapter MUST log a warning and return an empty array. It MUST
NOT throw.

Entries with a missing `key` or an empty/missing name (both `canonicalName`
and `scientificName` absent) MUST be filtered out of the result.

#### Scenario: GBIF timeout does not crash the flow

- GIVEN GBIF's `/species/suggest` does not respond within 5 seconds
- WHEN the adapter's `suggest()` is called
- THEN it returns `[]` and logs a warning, without throwing

#### Scenario: GBIF returns a malformed entry

- GIVEN one result in GBIF's response has no `key`
- WHEN the adapter maps the response
- THEN that entry is dropped from the returned list; other valid entries are
  still returned

---

### Requirement: Transport Parity (REST, GraphQL, MCP)

The system MUST expose `GbifSpeciesSearchQuery` via all three transports,
consistent with every other bounded context in this repo:

| Transport | Surface |
|---|---|
| GraphQL | `gbifSpeciesSearch(input: GbifSpeciesSearchRequestDto!): [GbifSpeciesSuggestionResponseDto!]!` query |
| REST | `GET /plant-species-search?name=...&limit=...` |
| MCP | `gbif_species_search` tool |

All three MUST require JWT authentication (`JwtAuthGuard`) only — no
`X-Space-ID` / `SpaceContext` requirement, since this query is not
tenant-scoped (matches the deleted `plant-species` catalog's own
JWT-only convention).

All three MUST dispatch via `QueryBus` only — no direct service injection in
transport, no direct adapter/port injection in resolvers/controllers/tools.

This context is explicitly EXEMPT from the mandatory `Criteria`/
`findByCriteria` filter pattern otherwise required for every context's list
query (see `openspec/config.yaml` architecture rules) — this is a live
external passthrough search, not a paginated/filtered local list, and has no
persisted rows to filter.

#### Scenario: GraphQL query returns suggestions

- GIVEN valid JWT in GraphQL context
- WHEN `gbifSpeciesSearch` is executed with `{ name: "Ficus" }`
- THEN a list of `GbifSpeciesSuggestionResponseDto` is returned

#### Scenario: REST endpoint returns suggestions

- GIVEN valid JWT
- WHEN `GET /plant-species-search?name=Ficus` is called
- THEN 200 is returned with a JSON array of suggestions

#### Scenario: Unauthenticated request rejected

- GIVEN no JWT
- WHEN any of the three transports is called
- THEN 401 Unauthorized (or the transport-equivalent) is returned
