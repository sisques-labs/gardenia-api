import { NumberValueObject } from '@sisques-labs/nestjs-kit';

/**
 * A resolved species' external catalog key. Provider-agnostic on purpose —
 * this context never assumes it came from GBIF specifically; see
 * `resolvedSpeciesProvider` on the aggregate for which provider a given key
 * belongs to. Positive integer, matching every provider key shape observed
 * so far (GBIF's own `usageKey` included).
 */
export class PlantIdentificationSpeciesKeyValueObject extends NumberValueObject {
  constructor(value: number) {
    super(value, { min: 1, allowDecimals: false });
  }
}
