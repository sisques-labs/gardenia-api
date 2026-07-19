# Tasks: Select any PlantNet candidate when converting an identification to a Plant

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200 – 300 (one new small service + exception, one command/handler branch, three DTO/schema touch-ups) |
| 400-line budget risk | Low |
| Delivery strategy | Single commit, no phased branch needed |

## Phase 1: Domain

- [ ] 1.1 `domain/exceptions/plant-identification-candidate-not-found.exception.ts` — extends `BaseException`, message includes the identification id and the requested rank

## Phase 2: Application

- [ ] 2.1 `application/services/write/resolve-selected-candidate-species-match/resolve-selected-candidate-species-match.service.ts` (+ spec) — input `{ candidate: IPlantIdentificationCandidate }`, calls `IPlantSpeciesPort.search(candidate.scientificName.value, 1)`, returns `{ speciesKey: number | null; scientificName: string }` (falls back to `candidate.scientificName.value` when no GBIF match) — no confidence-threshold check
- [ ] 2.2 `application/commands/create-plant-from-identification/create-plant-from-identification.command.ts` — add `selectedCandidateRank?: number` to both `CreatePlantFromIdentificationCommandInput` and the command class (wrap in `PlantIdentificationRankValueObject` when present, matching how candidates already store rank)
- [ ] 2.3 `application/commands/create-plant-from-identification/create-plant-from-identification.handler.ts` (+ spec) — branch per design.md's Data Flow: when `selectedCandidateRank` is set, find the matching candidate (throw `PlantIdentificationCandidateNotFoundException` if absent) and resolve via 2.1, skipping `AssertPlantIdentificationResolvedService` entirely; when absent, keep the existing `AssertPlantIdentificationResolvedService` path unchanged

## Phase 3: Transport

- [ ] 3.1 `transport/exceptions/plant-identification-exception.filter.ts` — map `PlantIdentificationCandidateNotFoundException` → 400 (or let it fall through to the filter's existing generic-400 default; confirm which at apply time against the sibling exceptions' explicit-mapping convention)
- [ ] 3.2 `transport/graphql/dtos/requests/create-plant-from-identification.request.dto.ts` — add optional `selectedCandidateRank: number` (GraphQL `Int`, `@IsOptional() @IsInt() @Min(0)`)
- [ ] 3.3 `transport/mcp/schemas/create-plant-from-identification.schema.ts` — add matching optional `selectedCandidateRank` (Zod `z.number().int().min(0).optional()`)
- [ ] 3.4 `plant-identification.module.ts` — register `ResolveSelectedCandidateSpeciesMatchService` in `APPLICATION_SERVICES`

## Phase 4: Tests

- [ ] 4.1 Unit: `resolve-selected-candidate-species-match.service.spec.ts` (GBIF match found / not found)
- [ ] 4.2 Unit: `create-plant-from-identification.handler.spec.ts` — new cases: selected rank on a resolved identification (overrides the auto-resolved species), selected rank on a `no_match` identification (now succeeds), selected rank not found (400), omitted field on both `resolved` and `no_match` identifications (unchanged existing behavior)
- [ ] 4.3 Integration/E2E: extend the existing `create-plant-from-identification` GraphQL mutation coverage with a `selectedCandidateRank` case (`no_match` identification converts successfully)
- [ ] 4.4 `pnpm lint` && `pnpm tsc --noEmit` clean
- [ ] 4.5 `pnpm test:cov` — confirm the 80% global gate still holds

## Phase 5: Docs

- [ ] 5.1 Update `src/contexts/plant-identification/README.md`'s `CreatePlantFromIdentification` section to document `selectedCandidateRank`
- [ ] 5.2 On archive: fold this change's `specs/plant-identification/spec.md` delta into `openspec/specs/plant-identification/spec.md`
