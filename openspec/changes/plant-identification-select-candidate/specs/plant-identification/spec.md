# PlantIdentification — select any candidate on conversion

## ADDED Requirements

### Requirement: CreatePlantFromIdentification accepts an explicit candidate selection

`CreatePlantFromIdentificationCommand` MUST accept an optional
`selectedCandidateRank`. When present, the handler MUST resolve the
candidate at that `rank` on the identification (not
`identification.resolved`) against the `plant-species` catalog and use the
result to create the plant, regardless of the identification's `status`.

#### Scenario: Selecting a lower-ranked candidate on a resolved identification

- GIVEN an identification with `status: 'resolved'` and 3 candidates, where
  the user believes rank `2` (not the auto-resolved rank `0`) is correct
- WHEN `CreatePlantFromIdentification` is dispatched with
  `selectedCandidateRank: 2`
- THEN the plant is created using rank `2`'s scientific name (resolved
  against GBIF where possible), not the identification's auto-resolved
  species

#### Scenario: Selecting a candidate on a `no_match` identification

- GIVEN an identification with `status: 'no_match'` (no top candidate
  cleared the confidence threshold) and a non-empty candidate list
- WHEN `CreatePlantFromIdentification` is dispatched with a
  `selectedCandidateRank` matching one of those candidates
- THEN the plant is created successfully — this identification could not be
  converted at all before this change

#### Scenario: Selected candidate has no GBIF match

- GIVEN a selected candidate whose scientific name returns no results from
  `GbifSpeciesSearchQuery`
- WHEN `CreatePlantFromIdentification` is dispatched with that candidate's
  rank
- THEN the plant is still created, with `gbifSpeciesKey: null` and
  `speciesScientificName` set to PlantNet's raw candidate name

#### Scenario: Selected rank does not exist on the identification

- GIVEN an identification with candidates at ranks `0`, `1`, `2`
- WHEN `CreatePlantFromIdentification` is dispatched with
  `selectedCandidateRank: 5`
- THEN the request fails with `PlantIdentificationCandidateNotFoundException`
  (400) and no plant is created

#### Scenario: Omitting the selection preserves existing behavior

- GIVEN an identification with `status: 'resolved'`
- WHEN `CreatePlantFromIdentification` is dispatched without
  `selectedCandidateRank`
- THEN the plant is created from `identification.resolved`, exactly as
  before this change

- GIVEN an identification with `status: 'no_match'`
- WHEN `CreatePlantFromIdentification` is dispatched without
  `selectedCandidateRank`
- THEN the request still fails with `PlantIdentificationNotResolvedException`
  (409), exactly as before this change
