# Tasks: Plant Species Catalog (Global) + Plants Link

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1400–1800 |
| 400-line budget risk | **High** |
| Chained PRs recommended | **Yes** |
| Suggested split | PR1: plant-species domain+app · PR2: plant-species infra+transport · PR3: plants FK+port · PR4: tests |
| Delivery strategy | chained PRs strongly recommended |

---

## Dependency Graph

```
T1 (plant_species table)
T1 → T2–T6 (plant-species domain)
T6 → T7–T14 (plant-species application)
T1 → T15–T17 (plant-species infra)
T17, T14 → T18 (module)
T18 → T19, T20 (REST, GraphQL)
T1 → T21 (alter plants)
T21 → T22–T28 (plants domain/app changes)
T22–T28, T18 → T29–T31 (plants port/enrich)
T19–T31 → T40–T43 (tests)
```

---

## Phase 1: plant-species — Migration + Domain

- [x] T1: Migration `CreatePlantSpecies` — table `plant_species` (id, name varchar(200) NOT NULL UNIQUE, timestamps); **no** `space_id`.
- [x] T2: VOs `plant-species-id`, `plant-species-name` (max 200, trim, non-empty).
- [x] T3: Aggregate, interface, primitives, view-model, builder — no spaceId.
- [x] T4: Events created/updated/deleted + event data interface.
- [x] T5: Exceptions: not-found, name-already-exists, in-use. Update `base-exception.filter.ts` (404, 409, 409).
- [x] T6: Read/write repository interfaces; write adds `findByNameNormalized`.

---

## Phase 2: plant-species — Application

- [x] T7: `CreatePlantSpecies` command + handler (global name assert).
- [x] T8: `UpdatePlantSpecies` command + handler.
- [x] T9: `DeletePlantSpecies` command + handler + `AssertPlantSpeciesNotInUseService` via `IPlantSpeciesReferencePort`.
- [x] T10: `PlantSpeciesFindById` query + handler.
- [x] T11: `PlantSpeciesFindByCriteria` query + handler.
- [x] T12: Assert view-model exists, assert aggregate exists, assert name available (global, case-insensitive).
- [x] T13: `IPlantSpeciesReferencePort` + `PlantSpeciesReferenceAdapter` (count plants by `plant_species_id`).
- [x] T14: Unit tests: domain + application (≥80% coverage).

---

## Phase 3: plant-species — Infrastructure + Module

- [x] T15: `PlantSpeciesTypeOrmEntity` — `@Unique(['name'])`, no spaceId.
- [x] T16: TypeORM mapper.
- [x] T17: Read/write repos — **raw** Repository, no tenant wrapper; `findByNameNormalized` on write.
- [x] T18: `plant-species.module.ts` + `AppModule` import; update `openspec/config.yaml`.

---

## Phase 4: plant-species — Transport

- [x] T19: REST — DTOs, mapper, controller (JwtAuthGuard only; 5 endpoints).
- [x] T20: GraphQL — request/response DTOs, mapper, queries + mutations resolvers, registered enums.
- [x] T21: Integration tests `test/integration/plant-species/` — CRUD, global unique name, delete blocked when in use.
- [x] T22: E2E REST + GraphQL `test/e2e/plant-species/`.

---

## Phase 5: plants — Schema + Domain

- [x] T23: Migration `AlterPlantsPlantSpeciesId` — add `plant_species_id` uuid NULL; drop `species` column.
- [x] T24: Remove `PlantSpeciesValueObject` and species field from aggregate, interface, primitives, builder, events (`PlantSpeciesChanged` etc.).
- [x] T25: Add `plantSpeciesId` to aggregate (UUID VO in plants), update create/update/delete flows.
- [x] T26: Update TypeORM entity + mapper.
- [x] T27: Update `CreatePlant` / `UpdatePlant` commands — `plantSpeciesId` optional; assert catalog exists when set.
- [x] T28: Update REST/GraphQL plant DTOs — remove `species` string; add `plantSpeciesId`; response nested `species` object.

---

## Phase 6: plants — Port + Enrichment (QR pattern)

- [x] T29: `PlantSpeciesViewModel`, `PlantSpeciesBuilder`, `IPlantSpeciesPort`, `plant-species.port.ts`.
- [x] T30: `PlantSpeciesAdapter` (QueryBus → `PlantSpeciesFindByIdQuery`).
- [x] T31: `EnrichPlantWithSpeciesService` + wire in find-by-id and find-by-criteria handlers; update `PlantViewModel` + plant builder/mappers.
- [x] T32: Register port + enrich service in `plants.module.ts`.
- [x] T33: Unit specs: enrich service, adapter (mocked bus), updated plant handlers.

---

## Phase 7: Verification

- [x] T40: E2E plants — create with `plantSpeciesId`, read nested `species`, update link, null species.
- [x] T41: Cross-space plant still tenant-isolated; global catalog shared across spaces.
- [x] T42: Run `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm build`.
- [x] T43: Update `CHANGELOG.md` — breaking: removed plant `species` string; added global catalog + `plantSpeciesId`.
