# Design: Select any PlantNet candidate when converting an identification to a Plant

## Technical Approach

Add one optional field to an existing command and one new branch in its
existing handler — no new aggregate field, no migration, no new port.
`identification.candidates` (persisted at `IdentifyPlant` time, unchanged by
this proposal) already carries everything needed to resolve any candidate:
`scientificName`, `rank`. Resolving a *chosen* candidate against GBIF reuses
the exact same `IPlantSpeciesPort.search()` call `ResolvePlantSpeciesMatchService`
already makes for the top candidate at identify time — just without that
service's confidence-threshold gate, since the user explicitly picking a
candidate **is** the confirmation a threshold would otherwise stand in for.

A new, small service (`ResolveSelectedCandidateSpeciesMatchService`) is kept
separate from `ResolvePlantSpeciesMatchService` rather than generalizing the
latter, because their inputs differ in kind (identify-time: a raw
`PlantNetIdentificationCandidateResult` from the just-called adapter,
pre-persistence; create-time: a persisted `IPlantIdentificationCandidate`
value-object bundle, looked up by rank) and their policies differ
(threshold-gated vs. not) — forcing one shared service would mean branching
on a `skipThreshold` flag, which is worse than two small, single-purpose
services.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|----------|--------|------------------------|-----------|
| Select by `rank`, not `scientificName` | `selectedCandidateRank: number`, matched against `identification.candidates[].rank.value` | Match by `scientificName` string | `rank` is the value already used to preserve PlantNet's own ordering (`PlantIdentificationRankValueObject`) and is guaranteed unique per identification; a scientific-name string match adds a normalization/casing failure mode for no benefit. |
| Unmatched GBIF search falls back to the raw PlantNet name, does not fail the request | `ResolveSelectedCandidateSpeciesMatchService` returns `{ speciesKey: null, scientificName: candidate.scientificName }` when `plantSpeciesPort.search()` finds nothing | Reject with 404/422 if GBIF has no match for the chosen candidate | The user is confirming a name they can see and read, not a GBIF key — `plants.CreatePlantCommand` already supports `speciesScientificName` without a `gbifSpeciesKey` (used by the app's own fully-manual "create plant" flow already). Forcing a GBIF match here would make some correct human picks impossible to save, which defeats the point of the feature. |
| No threshold applied to a user-selected candidate | `ResolveSelectedCandidateSpeciesMatchService` does not call `PlantIdentificationScoreValueObject.meetsThreshold()` at all | Still reject candidates below `PLANTNET_MIN_CONFIDENCE` even when explicitly selected | The threshold exists to gate *automatic* resolution of an unconfirmed guess. Once a human has looked at the photo and the candidate list and picked one, the score is no longer meaningful as a gate — that's the entire reason this proposal exists (case 2 in proposal.md's "Why"). |
| `selectedCandidateRank` bypasses `AssertPlantIdentificationResolvedService` entirely (not just its 409) | Handler branches *before* calling that service: if `selectedCandidateRank` is set, the resolved/no_match `status` is irrelevant and the assert is skipped altogether | Keep calling the assert and only relax it internally | Simpler control flow; also correctly allows converting a `no_match` identification (which has `resolved: null` by definition) as long as `candidates` is non-empty — exactly the case this proposal targets. |
| Omitted field ⇒ byte-for-byte existing behavior | `selectedCandidateRank` optional; when absent, the handler takes the exact same path (and same `AssertPlantIdentificationResolvedService` call) as today | Make it required, force every caller to always name a candidate (e.g. rank of the already-resolved top one) | Zero risk to existing callers (REST/GraphQL/MCP clients built against the current contract); `gardenia-web`'s existing "Crear planta con esta especie" CTA on an already-resolved identification keeps working unmodified if it chooses not to send the new field. |

## Data Flow

```
GraphQL: createPlantFromIdentification(input: { identificationId, name,
                                                 imageUrl?, selectedCandidateRank? })
  ──CommandBus──> CreatePlantFromIdentificationCommandHandler
  │  AssertPlantIdentificationExistsService (404)
  │  ownership check: requestingUserId === identification.requestedByUserId (403)
  │  AssertPlantIdentificationNotConvertedService (409 if already converted)
  │
  ├─ IF command.selectedCandidateRank is set:
  │    candidate = identification.candidates.find(c => c.rank.value === selectedCandidateRank)
  │    if not found: throw PlantIdentificationCandidateNotFoundException (400)
  │    ResolveSelectedCandidateSpeciesMatchService.execute({ candidate })
  │      └─> IPlantSpeciesPort.search(candidate.scientificName.value, 1)
  │      <── best GBIF match { speciesKey, scientificName, provider } | []
  │      → { speciesKey: match?.speciesKey ?? null,
  │           scientificName: match?.scientificName ?? candidate.scientificName.value }
  │
  ├─ ELSE (existing path, unchanged):
  │    AssertPlantIdentificationResolvedService.execute(identification)
  │      → 409 PlantIdentificationNotResolvedException if identification.resolved is null
  │      → { speciesKey, scientificName } from identification.resolved*
  │
  ├─1─> IPlantsPort.createPlant({ name, gbifSpeciesKey: speciesKey,
  │        speciesScientificName: scientificName, imageUrl, userId })
  │        └─> PlantsAdapter ──CommandBus──> CreatePlantCommand ──> plants (unchanged)
  │        <── { id: plantId }
  └─2─> identification.convertToPlant(plantId) →
           PlantIdentificationConvertedToPlantEvent; writeRepository.save()

Response: { id: plantId }
```

## File Changes

```
application/
  commands/create-plant-from-identification/
    create-plant-from-identification.command.ts        # + selectedCandidateRank?: number
    create-plant-from-identification.handler.ts (+ .spec.ts)  # + branch
  services/write/resolve-selected-candidate-species-match/
    resolve-selected-candidate-species-match.service.ts (+ .spec.ts)   # new
domain/
  exceptions/
    plant-identification-candidate-not-found.exception.ts    # new, 400
transport/
  exceptions/plant-identification-exception.filter.ts   # + mapping for the exception above
  graphql/dtos/requests/create-plant-from-identification.request.dto.ts  # + selectedCandidateRank?: number
  mcp/schemas/create-plant-from-identification.schema.ts     # + selectedCandidateRank optional
plant-identification.module.ts   # register the new service
```

No migration, no entity/mapper changes — `selectedCandidateRank` is never
persisted; only its *resolution result* (`speciesKey`/`scientificName`) flows
into the existing `CreatePlantCommand` call, exactly like the top-candidate
path already does.

## Error handling summary

| Situation | Outcome |
|---|---|
| `selectedCandidateRank` matches an existing candidate | Resolves against GBIF (or falls back to the raw name), plant created |
| `selectedCandidateRank` does not match any candidate on this identification | `PlantIdentificationCandidateNotFoundException` (400) |
| `selectedCandidateRank` omitted, identification is `resolved` | Existing behavior — plant created from `identification.resolved` |
| `selectedCandidateRank` omitted, identification is `no_match` | Existing behavior — `PlantIdentificationNotResolvedException` (409) |
| Chosen candidate has no GBIF match | Plant still created, `gbifSpeciesKey: null`, `speciesScientificName` = PlantNet's raw name |
