# Delta for Plants — Plant Species Link + Enrichment

**Change:** plant-species-module  
**Base spec:** `openspec/specs/plants/spec.md`

---

## ADDED Requirements

### Requirement: IPlantSpeciesPort Contract

The `plants` bounded context MUST define `IPlantSpeciesPort` in `plants/application/ports/` and `PlantSpeciesViewModel` in `plants/domain/view-models/`. No file under `plants/application/` or `plants/domain/` MAY import from `@contexts/plant-species/`.

`IPlantSpeciesPort` MUST expose: `findByPlantSpeciesId(plantSpeciesId: string): Promise<PlantSpeciesViewModel | null>`.

`PlantSpeciesViewModel` MUST carry: `id: string`, `name: string`, `createdAt: Date`, `updatedAt: Date`.

#### Scenario: Port returns data when catalog entry exists

- GIVEN a plant with `plantSpeciesId` set
- WHEN `IPlantSpeciesPort.findByPlantSpeciesId` is called
- THEN it returns a `PlantSpeciesViewModel` with all fields populated

#### Scenario: Port returns null when catalog entry missing

- GIVEN a plant with `plantSpeciesId` pointing to a deleted or unknown id
- WHEN `IPlantSpeciesPort.findByPlantSpeciesId` is called
- THEN it returns `null`

---

### Requirement: EnrichPlantWithSpeciesService

`EnrichPlantWithSpeciesService` MUST have a co-located unit spec using `jest.Mocked<IPlantSpeciesPort>`.

The spec MUST cover: enrichment when species exists, unchanged plant when `plantSpeciesId` is null, unchanged plant when port returns null.

#### Scenario: Service enriches plant when species found

- GIVEN a mocked `IPlantSpeciesPort` that returns `PlantSpeciesViewModel`
- WHEN `EnrichPlantWithSpeciesService.execute` is called
- THEN `PlantViewModel.species` is populated

#### Scenario: Service returns plant unchanged when no link

- GIVEN a plant with `plantSpeciesId` null
- WHEN `EnrichPlantWithSpeciesService.execute` is called
- THEN `PlantViewModel.species` is `null`

---

## MODIFIED Requirements

### Requirement: Plant Species Link Fields (replaces free-text species)

The `PlantAggregate`, `IPlantPrimitives`, and plant persistence entity MUST support an optional `plantSpeciesId` (UUID string or null).

The `plants.species` varchar column and `PlantSpeciesValueObject` MUST be removed.

`PlantViewModel` MUST expose `plantSpeciesId: string | null` and `species: PlantSpeciesViewModel | null`. The nested `species` object is enrichment-only and MUST NOT be persisted in primitives or the TypeORM entity.

Plant REST and GraphQL read responses MUST include nested `species` when linked, or `species: null` when `plantSpeciesId` is null.

Create and update plant commands MUST accept optional `plantSpeciesId` and MUST NOT accept a free-text `species` field.

When `plantSpeciesId` is provided, the handler MUST verify the catalog entry exists (via port or query) before persisting.

#### Scenario: Plant with species link returns nested species

- GIVEN a plant with `plantSpeciesId` pointing to a valid catalog entry
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.species` includes `id`, `name`, `createdAt`, `updatedAt`

#### Scenario: Plant without species link

- GIVEN a plant with `plantSpeciesId` null
- WHEN `PlantFindById` is dispatched
- THEN `PlantViewModel.plantSpeciesId` is null and `species` is null

#### Scenario: Create plant with plantSpeciesId

- GIVEN a valid catalog entry id
- WHEN `CreatePlant` is dispatched with `plantSpeciesId` set
- THEN the plant is persisted with that id and reads return enriched `species`

#### Scenario: Create plant rejects unknown plantSpeciesId

- GIVEN a non-existent catalog id
- WHEN `CreatePlant` is dispatched with that `plantSpeciesId`
- THEN the command fails with an appropriate not-found error

---

## REMOVED Requirements

### Requirement: Optional free-text species on Plant

**Reason:** Replaced by global catalog FK `plantSpeciesId` and enriched `PlantSpeciesViewModel`.

**Migration:** Drop `plants.species` column; clients must use `plantSpeciesId` and read nested `species` on responses.
