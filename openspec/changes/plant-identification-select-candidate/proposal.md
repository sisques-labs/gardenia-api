# Proposal: Select any PlantNet candidate when converting an identification to a Plant

> Follow-up to `plant-identification` (already applied). That change's
> proposal explicitly deferred this: "Manual override / picking a non-top
> candidate to resolve against ... below [the confidence threshold], the
> identification stays `no_match` and cannot yet be converted — the user sees
> the raw candidate list but there's no 'pick #3' UI/command yet." Raised
> directly by the product owner in an agent session (paired with a
> `gardenia-web` redesign change) — no Jira ticket.

## Why

`IdentifyPlant` already returns every PlantNet candidate with its confidence
score, and the web UI already renders them — but `CreatePlantFromIdentification`
only ever accepts the server's own auto-picked top candidate
(`identification.resolved`, set only when its score clears
`PLANTNET_MIN_CONFIDENCE`). Two real cases fall through today with no path
to creating a plant at all:

1. The top candidate is confident but wrong (PlantNet occasionally ranks a
   visually-similar species first) and the user can see the *right* one
   sitting at position 2 or 3.
2. Nothing cleared the threshold (`status: 'no_match'`) even though one of
   the candidates is, to a human looking at the photo, obviously correct.

In both cases the only escape today is abandoning the identification and
creating the plant manually from scratch, discarding PlantNet's work
entirely.

## What Changes

- `CreatePlantFromIdentificationCommand` gains an optional
  `selectedCandidateRank: number`. When provided, the handler resolves
  **that** candidate (not `identification.resolved`) against GBIF via the
  existing `IPlantSpeciesPort.search()`, using the raw PlantNet name as a
  fallback `speciesScientificName` when GBIF has no match for it (a real
  species name a human picked from PlantNet's own candidate list is a
  reasonable value to persist even unlinked to the GBIF catalog).
- When `selectedCandidateRank` is omitted, behavior is **unchanged**: the
  identification must already be `resolved` (`AssertPlantIdentificationResolvedService`
  still applies), matching every existing caller.
- `selectedCandidateRank` MUST reference one of the identification's own
  persisted candidates (validated against `identification.candidates`) —
  rejects with a new `PlantIdentificationCandidateNotFoundException` (400)
  otherwise. This is also what lifts the `no_match` restriction: a `no_match`
  identification has no `resolved` value but still has a full `candidates`
  list, so selecting any of them now succeeds regardless of `status`.
- GraphQL `createPlantFromIdentification(input)` mutation input gains the
  same optional `selectedCandidateRank: Int`. MCP
  `plant_identification_create_plant` tool schema gains the matching
  optional field. REST is untouched (this mutation was never exposed over
  REST — see the original design's "REST-only upload, GraphQL for everything
  else" decision).

## Capabilities

### Modified Capabilities

- `plant-identification`: `CreatePlantFromIdentification` can now target any
  candidate the identification returned, not only the server-auto-resolved
  one. No schema/migration change — `selectedCandidateRank` is a
  request-time input, not a persisted field.

**Deferred to future changes:**
- A fully manual species search (typing a name, independent of any PlantNet
  candidate) when *none* of the returned candidates are correct — the
  product owner separately asked for a GBIF search fallback in the paired
  `gardenia-web` change; on the API side this is already served by the
  existing, unrelated manual "create plant" flow (`plants`' own
  `CreatePlantCommand` + `GbifSpeciesSearchQuery`), so no new API capability
  is needed for it.

**Out of scope:**
- Changing what `IdentifyPlant` auto-resolves or persists at identify time —
  `resolvedGbifKey`/`resolvedScientificName`/`status` keep their exact
  current semantics.
- Any change to `plants`' `CreatePlantCommand` — this reuses it unchanged, as
  the original change already does for the top-candidate path.

## Impact

| Area | Impact |
|------|--------|
| `application/commands/create-plant-from-identification/` | Command gains a field; handler branches on it |
| `application/services/write/assert-plant-identification-resolved/` | Unchanged — still the path when no candidate is selected |
| `application/services/write/` | New `ResolveSelectedCandidateSpeciesMatchService` |
| `domain/exceptions/` | New `PlantIdentificationCandidateNotFoundException` (400) |
| `transport/exceptions/plant-identification-exception.filter.ts` | New mapping for the exception above |
| `transport/graphql/dtos/requests/create-plant-from-identification.request.dto.ts` | New optional `selectedCandidateRank: Int` field |
| `transport/mcp/schemas/create-plant-from-identification.schema.ts` | New optional field, matching |
| `plants`, `plant-species`, `files` | No changes — same reused ports as the original change |

## Rollback Plan

Purely additive to the command's input and one new branch in the handler;
the default (field omitted) path is byte-for-byte the existing behavior.
Revert = drop the new field, service, and exception; no migration to reverse
(no schema change).

## Open questions

1. **Selecting by `rank` vs. `scientificName`** — `rank` chosen (matches the
   existing `PlantIdentificationCandidateResult.rank`/persisted candidate
   `rank` column exactly, unambiguous even if two candidates ever shared a
   scientific name). Confirm this is also what `gardenia-web`'s paired
   change expects to send.
