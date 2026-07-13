/**
 * Enumerates every space in the system, regardless of the active
 * SpaceContext (a space enumeration is inherently cross-tenant — there is
 * no single active space to scope it to). Internal-only: no REST/GraphQL/MCP
 * surface. Dispatched exclusively by notifications' SpaceDirectoryAdapter to
 * drive the reconciliation job's per-space sweep.
 */
export class SpaceFindAllIdsQuery {}
