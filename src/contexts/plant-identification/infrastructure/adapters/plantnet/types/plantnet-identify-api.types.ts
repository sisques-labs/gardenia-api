/**
 * ============================================================================
 * ⚠️  UNVERIFIED RESPONSE SHAPE — MUST BE CONFIRMED AGAINST A LIVE CALL ⚠️
 * ============================================================================
 *
 * `openspec/changes/plant-identification/tasks.md` Phase 0, task 0.2 required
 * making one live manual call to `POST /v2/identify/all` with a sample photo
 * to confirm the exact response shape before this adapter shipped. That call
 * was **NOT** made — the coding agent implementing this change has no way to
 * obtain/use a real `PLANTNET_API_KEY` or reach the live PlantNet API.
 *
 * Everything below is modeled on PlantNet's *publicly documented* `/v2/
 * identify/{project}` response shape as described in proposal.md/design.md
 * (`results[].species.scientificNameWithoutAuthor`/`commonNames`/`score`),
 * which is itself a best-effort assumption, NOT a verified contract.
 *
 * BEFORE THIS SHIPS TO PRODUCTION:
 *   1. Obtain a real `PLANTNET_API_KEY` (my.plantnet.org).
 *   2. Make a real `POST https://my-api.plantnet.org/v2/identify/all` call
 *      with a sample multi-organ photo set.
 *   3. Diff the actual JSON against the types below — pay particular
 *      attention to: whether it's `scientificNameWithoutAuthor` vs a
 *      differently-named field, whether `commonNames` can be `null` vs `[]`,
 *      whether `score` is already 0–1 or a percentage, and the exact shape
 *      of PlantNet's 429/quota error body (this adapter currently keys off
 *      HTTP status alone, not the error body, so that part is lower-risk —
 *      but confirm PlantNet actually returns 429 for quota and not some
 *      other status).
 *   4. Update this file, `plantnet-identification.adapter.ts`, and their
 *      `.spec.ts` fixtures to match, and remove this banner once confirmed.
 * ============================================================================
 */

export interface PlantNetIdentifySpecies {
  scientificNameWithoutAuthor: string;
  scientificNameAuthorship?: string;
  scientificName?: string;
  commonNames?: string[];
}

export interface PlantNetIdentifyResult {
  score: number;
  species: PlantNetIdentifySpecies;
}

export interface PlantNetIdentifyApiResponse {
  results?: PlantNetIdentifyResult[];
}
