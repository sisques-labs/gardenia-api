# Design: Enrich PlantSpecies (rename + descriptive fields + enrichment mutation)

**Change**: `plant-species-enrich`
**Issue**: #172
**Status**: designed
**Artifact store**: openspec
**Architecture**: DDD + CQRS + Hexagonal (NestJS, `@sisques-labs/nestjs-kit`)

> NOTE: This design supersedes the original proposal's scope. The proposal assumed
> `name` and `scientificName` were two separate fields, both nullable. The user
> later clarified (engram `sdd/plant-species-enrich/proposal`, decision #955) that
> **`scientificName` IS the existing `name` field renamed** — NOT NULL, UNIQUE,
> VARCHAR(300). Plus a new `enrichPlantSpecies(id)` mutation backed by an external
> botanical API. This document reflects the corrected scope.

---

## 1. Scope recap (authoritative)

| Field | Change | Constraints |
|-------|--------|-------------|
| `name` → `scientificName` | **rename** | NOT NULL, UNIQUE, VARCHAR(300) |
| `description` | **new** | nullable, VARCHAR(2000) |
| `imageUrl` | **new** | nullable, VARCHAR(500) |

Plus:
- New mutation `enrichPlantSpecies(id: ID!)` → external botanical API → `UpdatePlantSpeciesCommand`.
- Create the missing `update-plant-species.handler.spec.ts`.

---

## 2. Architecture approach

We keep the existing **slice-per-aggregate** layout and the proven nullable-VO
pattern from `Plant.imageUrl`. The only genuinely new architectural surface is the
**external API integration**, which must respect the hexagonal boundary: a port in
the application layer, an adapter in infrastructure, zero HTTP knowledge in the
command handler.

### Layering for enrichment (the only new flow)

```
GraphQL resolver (enrichPlantSpecies)
        │  CommandBus.execute(new EnrichPlantSpeciesCommand(id))
        ▼
EnrichPlantSpeciesCommandHandler  (application)
        │  1. assertExists(id)            → load aggregate (current scientificName)
        │  2. port.findByScientificName() → IPlantSpeciesReference | null
        │  3. CommandBus.execute(UpdatePlantSpeciesCommand{ description?, imageUrl? })
        ▼
IPlantSpeciesEnrichmentPort  (application/ports — interface + Symbol)
        ▲ implemented by
GbifPlantSpeciesEnrichmentAdapter  (infrastructure/adapters)
        │  HttpService (GET api.gbif.org/v1/...)
        ▼
   GBIF REST API
```

Key rule (matches existing `PLANT_SPECIES_REFERENCE_PORT`): the handler depends on
the **port Symbol + interface**, never on Axios or GBIF types.

---

## 3. ADR-001 — External botanical API: GBIF (not Trefle)

**Decision**: Use **GBIF** (`https://api.gbif.org/v1`), no authentication.

**Context**: We need scientific name canonicalization plus (best-effort)
description and image for a species, triggered on demand by a mutation.

**Comparison**:

| Criterion | GBIF | Trefle |
|-----------|------|--------|
| Auth required | No (anonymous, free) | Yes (API token per request) |
| Reliability | Government/consortium-backed, stable SLA | Service unmaintained / intermittently down since ~2021 |
| Scientific name | `/species/match` canonical name — excellent | Good |
| Description | `/species/{key}` vernacular + description blocks — partial | `common_name` / observations — partial |
| Image | occurrence media / species media — inconsistent | `image_url` per species — when up, better |
| Rate limits | Generous, no key | Token-gated |

**Decision rationale**:
- **No auth** keeps config/secrets surface at zero for the MVP. Trefle would force a
  secret into env + the auth provider, for a service we cannot rely on staying up.
- **Reliability** trumps Trefle's slightly richer image field. An enrichment mutation
  that times out against a dead host is worse than one that returns "no image found."

**GBIF call plan** (adapter internal, not leaked):
1. `GET /v1/species/match?name={scientificName}` → resolves `usageKey` + canonical
   `scientificName`. If `matchType === 'NONE'` → return `null` (no match).
2. `GET /v1/species/{usageKey}` → `descriptions`/vernacular for `description`
   (take first English description block, truncate to 2000).
3. `GET /v1/species/{usageKey}/media?limit=1` → first image `identifier` for
   `imageUrl` (truncate/validate to 500; skip if absent).

The adapter maps GBIF's response into a context-local DTO
`PlantSpeciesEnrichment` (`{ description: string | null; imageUrl: string | null }`)
— GBIF shapes never cross into application/domain.

**Rejected alternatives**:
- **Trefle**: rejected — auth dependency + unreliable host.
- **Hardcoded/manual entry only**: rejected — issue #172 explicitly wants automated
  enrichment.

**Risk**: GBIF description/image coverage is partial. Accepted — enrichment is
best-effort and additive; fields stay nullable.

---

## 4. ADR-002 — HTTP client: `@nestjs/axios` HttpModule

**Decision**: Add `@nestjs/axios` + `axios` as direct dependencies and use
`HttpModule`/`HttpService` inside the adapter.

**Context**: `@nestjs/axios` and `axios` are **not** current direct dependencies
(only transitive in `pnpm-lock.yaml`). There is no existing HTTP-client convention
in the codebase — the only existing adapter (`PlantSpeciesReferenceAdapter`) talks
to the DB via `DataSource`, not HTTP.

**Decision rationale**:
- `HttpModule` is the idiomatic NestJS choice, integrates with DI, and is trivially
  mockable in adapter unit tests (`HttpService` is injectable).
- Confine it to the infrastructure adapter; import `HttpModule` in
  `PlantSpeciesModule` (or a scoped sub-import) so the rest of the slice stays
  HTTP-agnostic.

**Rejected alternatives**:
- **Native `fetch`**: works, but loses DI ergonomics and observable/interceptor
  support; less consistent with the NestJS-kit idiom.
- **Dedicated bespoke client class**: unnecessary abstraction over Axios for two
  GET calls.

**Adapter resilience requirements** (in the adapter, not the handler):
- Per-request timeout (e.g. 5s) via Axios config.
- `try/catch` around HTTP calls. On any transport error → log + return `null`
  (treated as "no enrichment available"), do NOT throw out of the adapter for
  network failures. Only the "command-level" decision to surface an error lives in
  the handler (see ADR-004).

---

## 5. ADR-003 — Enrichment flow reuses `UpdatePlantSpeciesCommand`

**Decision**: `EnrichPlantSpeciesCommandHandler` orchestrates: load aggregate →
call enrichment port using the aggregate's current `scientificName` → dispatch an
existing `UpdatePlantSpeciesCommand` with the fetched `description`/`imageUrl`.

**Context**: We already have a fully-wired `UpdatePlantSpeciesCommand` path
(validation, save, event publication, per-field changed events). Re-implementing
aggregate mutation inside the enrich handler would duplicate that and bypass the
update events.

**Decision rationale**:
- **DRY + event symmetry**: enrichment becomes "just another update", so it emits the
  same `PlantSpeciesUpdatedEvent` + per-field `*ChangedEvent`s for free.
- **Single write path**: only `UpdatePlantSpeciesCommandHandler` mutates the
  aggregate's descriptive fields — easier to reason about and test.
- The enrich handler stays thin: fetch + delegate. No repository writes of its own.

**Why dispatch a command (not call the aggregate directly)**: keeps the enrich
handler in the application orchestration role and avoids it depending on the write
repository. CommandBus dispatch is already the in-context pattern (resolvers do it).

**Rejected alternative**: enrich handler loads aggregate, calls
`aggregate.update(...)`, saves, publishes itself — rejected: duplicates the update
handler's responsibilities (name-availability assertion is irrelevant here, but
save+publish wiring would be copy-pasted).

**Note on `scientificName` source**: the handler reads the **current**
`scientificName` from the loaded aggregate to query GBIF. It does NOT overwrite
`scientificName` from GBIF in the MVP (only `description` + `imageUrl` are enriched),
keeping the user-owned unique key authoritative. GBIF canonical-name reconciliation
is deferred.

---

## 6. ADR-004 — Error handling for enrichment

**Decision**: Two-tier handling.

| Situation | Adapter behavior | Handler behavior | Client result |
|-----------|------------------|------------------|---------------|
| Species not found in GBIF (`matchType: NONE`) | return `null` | no UpdateCommand dispatched | success, message "no enrichment data found" |
| GBIF unreachable / timeout / 5xx | log + return `null` | no UpdateCommand dispatched | success, message "enrichment source unavailable" |
| Aggregate id not found | n/a | `AssertPlantSpeciesExistsService` throws `PlantSpeciesNotFoundException` | mapped error (existing filter) |
| Partial data (e.g. image only) | return partial DTO | dispatch UpdateCommand with present fields only | success |

**Rationale**:
- Enrichment is **best-effort and idempotent-ish**: an unreachable third party must
  not 500 the mutation. Returning `null` → "nothing to update" is a valid,
  non-erroneous outcome. The mutation still resolves `success: true` with an
  informative message (consistent with the existing `MutationResponseDto` shape).
- Only **domain-level** failure (species id doesn't exist) flows through the existing
  `PlantSpeciesExceptionFilter` as an error, because that IS a client error.

**Open consideration (non-blocking)**: if product later wants "enrichment failed" to
be a hard error, introduce a `PlantSpeciesEnrichmentUnavailableException`. Out of
scope for MVP.

---

## 7. ADR-005 — Value objects

**Decision**: All three descriptive fields are simple `StringValueObject`
subclasses with length validation only (no rich behavior), matching
`PlantSpeciesNameValueObject` / `PlantImageUrlValueObject`.

| VO | File | MAX_LENGTH | allowEmpty | Nullable in aggregate |
|----|------|-----------|------------|----------------------|
| `PlantSpeciesScientificNameValueObject` | `domain/value-objects/plant-species-scientific-name/` | **300** (was 200) | false | No (required) |
| `PlantSpeciesDescriptionValueObject` | `domain/value-objects/plant-species-description/` | 2000 | false | Yes |
| `PlantSpeciesImageUrlValueObject` | `domain/value-objects/plant-species-image-url/` | 500 | false | Yes |

**Rename mechanics**: `PlantSpeciesNameValueObject` is **renamed** to
`PlantSpeciesScientificNameValueObject` (file + folder + class), MAX_LENGTH bumped
200 → 300. Trim is preserved. This is a breaking internal rename touching aggregate,
builder, interface, primitives, view-model, commands, mappers, events, transport,
and the `assert-plant-species-name-available` service.

**Nullable VO semantics**: description/imageUrl are `VO | null`. They are constructed
only when a non-null value is provided (mirrors the `?` construction in
`UpdatePlantSpeciesCommand`). The aggregate stores `VO | null`; `toPrimitives()`
emits `string | null`.

**`imageUrl` validation depth**: length only — NO URL-format validation (matches
`Plant.imageUrl`, confirmed by proposal open-question #1).

---

## 8. Component & file map

### Domain
- **Rename**: `value-objects/plant-species-name/` → `plant-species-scientific-name/`
  (class `PlantSpeciesScientificNameValueObject`, MAX_LENGTH 300).
- **New VOs**: `plant-species-description/`, `plant-species-image-url/`.
- `interfaces/plant-species.interface.ts`: `name` → `scientificName`; add
  `description: PlantSpeciesDescriptionValueObject | null`,
  `imageUrl: PlantSpeciesImageUrlValueObject | null`.
- `primitives/plant-species.primitives.ts`: `name: string` → `scientificName: string`;
  add `description: string | null`, `imageUrl: string | null`.
- `aggregates/plant-species.aggregate.ts`: rename `_name`→`_scientificName` +
  getter/change method; add `_description`, `_imageUrl` fields, getters,
  `update()` branches, `changeDescription()`, `changeImageUrl()`, `toPrimitives()`.
- `builders/plant-species.builder.ts`: `withName`→`withScientificName`;
  add `withDescription`, `withImageUrl`; `build()`/`buildViewModel()`/`validate()`
  updates (scientificName required, description/imageUrl optional → `null`).
- `view-models/plant-species.view-model.ts`: `name`→`scientificName`; add nullable
  `description`, `imageUrl`.
- **New events** under `events/field-changed/`:
  `plant-species-scientific-name-changed/` (rename of name-changed),
  `plant-species-description-changed/`, `plant-species-image-url-changed/` — all
  `BaseEvent<IFieldChangedEventData<string>>`. `IPlantSpeciesEventData` is a type
  alias of primitives, so payloads update automatically.

### Application
- `commands/create-plant-species/`: command input `name`→`scientificName`, add
  optional `description?`/`imageUrl?`; handler `withScientificName` + optional fields.
- `commands/update-plant-species/`: command input `name`→`scientificName` (optional),
  add `description?`/`imageUrl?` (`VO | undefined`); handler passes them to
  `aggregate.update(...)`. Name-availability assert keyed on `scientificName`.
- **New** `commands/enrich-plant-species/`:
  - `enrich-plant-species.command.ts` (`{ id }` → `PlantSpeciesIdValueObject`).
  - `enrich-plant-species.handler.ts` (orchestrates per ADR-003/004; injects
    `AssertPlantSpeciesExistsService`, `IPlantSpeciesEnrichmentPort` via Symbol,
    `CommandBus`).
- **New port** `application/ports/plant-species-enrichment.port.ts`:
  `PLANT_SPECIES_ENRICHMENT_PORT = Symbol(...)`,
  `interface IPlantSpeciesEnrichmentPort { enrich(scientificName: string): Promise<PlantSpeciesEnrichmentResult | null> }`
  with `PlantSpeciesEnrichmentResult = { description: string | null; imageUrl: string | null }`.
- `assert-plant-species-name-available.service.ts`: internal references renamed to
  scientificName (keep filename or rename to `-scientific-name-available`; **decide
  in tasks** — recommend keeping filename to limit churn, rename param/usages only).

### Infrastructure
- `entities/plant-species.entity.ts`: `name`→`scientificName` (`@Column varchar 300`),
  `@Unique(['scientificName'])`; add nullable `description` (varchar 2000),
  `imageUrl` (varchar 500).
- `mappers/plant-species-typeorm.mapper.ts`: `withName`→`withScientificName`; map
  `description`/`imageUrl` both directions (null-safe).
- **New** `adapters/gbif-plant-species-enrichment.adapter.ts` implementing
  `IPlantSpeciesEnrichmentPort` via `HttpService` (ADR-002, GBIF calls per ADR-001).
- **New migration** (see ADR-006).

### Transport
- GraphQL request DTOs (create/update): `name`→`scientificName`, add nullable
  `description`/`imageUrl`. **New** `plant-species-enrich.request.dto.ts` (`id`).
- GraphQL response DTO + mapper: expose `scientificName`, nullable `description`,
  `imageUrl`.
- **New mutation** `enrichPlantSpecies` in `plant-species-mutations.resolver.ts` →
  `EnrichPlantSpeciesCommand`, returns `MutationResponseDto`.
- REST DTOs + mapper: mirror the GraphQL field changes
  (`@ApiPropertyOptional` for the two new fields). (REST enrich endpoint optional —
  **decide in tasks**; MVP issue mentions a mutation → GraphQL is mandatory, REST
  parity is nice-to-have.)

### Module wiring (`plant-species.module.ts`)
- Import `HttpModule`.
- Register `EnrichPlantSpeciesCommandHandler` in `COMMAND_HANDLERS`.
- Add adapter binding:
  `{ provide: PLANT_SPECIES_ENRICHMENT_PORT, useClass: GbifPlantSpeciesEnrichmentAdapter }`
  to `INFRASTRUCTURE_ADAPTERS`.

### Tests
- Extend `plant-species.aggregate.spec.ts` (rename + new field change events).
- Extend `create-plant-species.handler.spec.ts`.
- **Create** `update-plant-species.handler.spec.ts`.
- **Create** `enrich-plant-species.handler.spec.ts` (mock port + CommandBus: match,
  no-match → no dispatch, partial data, not-found id).
- **Create** adapter unit test (mock `HttpService`: match, NONE, network error).

---

## 9. ADR-006 — Migration strategy

**Decision**: Single migration `AlterPlantSpeciesEnrich{timestamp}` doing:

```sql
ALTER TABLE "plant_species" RENAME COLUMN "name" TO "scientific_name";
ALTER TABLE "plant_species" ALTER COLUMN "scientific_name" TYPE character varying(300);
-- UNIQUE constraint: rename if PG carried it, else recreate
ALTER TABLE "plant_species" RENAME CONSTRAINT "UQ_plant_species_name" TO "UQ_plant_species_scientific_name";
ALTER TABLE "plant_species" ADD COLUMN "description" character varying(2000);
ALTER TABLE "plant_species" ADD COLUMN "image_url" character varying(500);
```

`down()` reverses exactly (drop new columns, shrink to 200, rename back, rename
constraint back).

**Rationale**:
- `RENAME COLUMN` preserves existing data and the unique index without a
  drop/recreate dance — Postgres keeps index data through a rename.
- Column type widen 200→300 is a safe in-place change.
- New columns are nullable with no default → instant, lock-light, backward-compatible.

**Naming/timestamp**: follow existing `{epochMillis}-PascalCaseName.ts` convention;
next sequential timestamp after `...013`. Class name + `name` property must match the
file (existing convention).

**Risk — constraint name**: the `RENAME CONSTRAINT` assumes the unique constraint is
named `UQ_plant_species_name` (it is, per migration `...008`). Verify the live name
before finalizing; if TypeORM auto-generated a different name in some env, the rename
target must match. Tasks phase should confirm against the actual schema.

---

## 10. Data flow summary

**Create/Update** (extended existing flow): resolver → command (`scientificName`
required on create, all fields optional on update) → aggregate
build/`update()` → per-field `*ChangedEvent` + `PlantSpeciesUpdatedEvent` → save →
publish → mapper → DB columns.

**Enrich** (new flow): resolver(`id`) → `EnrichPlantSpeciesCommand` →
handler loads aggregate → `enrichmentPort.enrich(currentScientificName)` →
GBIF adapter (match → species → media) → `{ description?, imageUrl? } | null` →
if non-null, `CommandBus.execute(UpdatePlantSpeciesCommand)` → reuses full update
path → events + persistence.

---

## 11. Integration points & dependencies

- **New runtime deps**: `@nestjs/axios`, `axios` (direct).
- **External**: `api.gbif.org/v1` (anonymous HTTP). No new secrets/env required for
  MVP. Consider an env-configurable base URL for testability — recommended but optional.
- **No cross-context impact**: everything stays inside `src/contexts/plant-species/`
  plus `src/database/migrations/` plus `package.json`.

---

## 12. Risks & assumptions

1. **GBIF coverage** — description/image are partial; nullable fields absorb this.
2. **Rename blast radius** — `name`→`scientificName` touches ~15 files; mechanical but
   wide. The missing update-handler spec is created here to cover the riskiest path.
3. **Constraint rename name** (ADR-006) — verify live constraint name before migration.
4. **HttpModule is a new dependency** — small, idiomatic, confined to one adapter.
5. **REST enrich parity** left as a tasks-phase decision; GraphQL mutation is the
   mandatory deliverable.
6. **Filename of name-availability service** — recommend keeping the filename, rename
   only internals, to limit churn; final call in tasks.
```
