# Spaces Specification — Delta: Internal Space Enumeration

> Delta applied on top of `openspec/specs/spaces/spec.md`. Adds
> `SpaceFindAllIdsQuery`, an internal-only query with no transport surface,
> consumed exclusively by the `notifications` context's reconciliation job to
> enumerate every space to sweep.

---

## ADDED Requirements

### Requirement: SpaceFindAllIds Query

The system MUST expose a `SpaceFindAllIdsQuery` that returns the `id` of
every space in the system, with no filtering and no pagination. This query
MUST NOT be scoped by `SpaceContext` (a space enumeration is inherently
cross-tenant — there is no single active space to scope it to).

This query MUST NOT be exposed over REST, GraphQL, or MCP. It is dispatched
over `QueryBus` exclusively by consumers that need to enumerate all tenants
(in v1: `notifications`' `SpaceDirectoryAdapter`).

#### Scenario: Returns every space regardless of active SpaceContext

- GIVEN spaces S1, S2, and S3 exist
- WHEN `SpaceFindAllIdsQuery` is dispatched with no `SpaceContext` established
- THEN the ids of S1, S2, and S3 are all returned

#### Scenario: Not reachable from a public transport surface

- GIVEN the `spaces` context's REST, GraphQL, and MCP transport layers
- WHEN their public surfaces are inspected
- THEN no route, resolver, or MCP tool dispatches `SpaceFindAllIdsQuery`
