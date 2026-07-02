import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { PlantQueryableField } from '@contexts/plants/transport/graphql/enums/plant/plant-queryable-field.enum';

/**
 * Expected `Filter.value` shape per {@link PlantQueryableField}, consumed by
 * `FilterValidationPipe`. No `enum` entries yet — plants has no domain enum
 * field today (`plant-registered-enums.graphql.ts` scaffold). Add one here
 * (`{ type: 'enum', enum: PlantStatusEnum }`) the day such a field exists.
 */
export const plantFilterableFields: FilterFieldRegistry<PlantQueryableField> = {
  [PlantQueryableField.NAME]: { type: 'string' },
  [PlantQueryableField.PLANT_SPECIES_ID]: { type: 'uuid' },
  [PlantQueryableField.PLANTING_SPOT_ID]: { type: 'uuid' },
  [PlantQueryableField.CREATED_AT]: { type: 'date' },
  [PlantQueryableField.UPDATED_AT]: { type: 'date' },
};
