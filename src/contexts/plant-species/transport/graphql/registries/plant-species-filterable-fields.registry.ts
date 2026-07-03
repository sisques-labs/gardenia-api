import { FilterFieldRegistry } from '@sisques-labs/nestjs-kit';

import { PlantSpeciesQueryableField } from '@contexts/plant-species/transport/graphql/enums/plant-species-queryable-field.enum';

export const plantSpeciesFilterableFields: FilterFieldRegistry<PlantSpeciesQueryableField> =
  {
    [PlantSpeciesQueryableField.ID]: { type: 'uuid' },
    [PlantSpeciesQueryableField.SCIENTIFIC_NAME]: { type: 'string' },
    [PlantSpeciesQueryableField.DESCRIPTION]: { type: 'string' },
    [PlantSpeciesQueryableField.IMAGE_URL]: { type: 'string' },
    [PlantSpeciesQueryableField.CREATED_AT]: { type: 'date' },
    [PlantSpeciesQueryableField.UPDATED_AT]: { type: 'date' },
  };
