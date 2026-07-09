import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { PlantSpeciesQueryableField } from '@contexts/plant-species/transport/graphql/enums/plant-species-queryable-field.enum';
import { plantSpeciesFilterableFields } from '@contexts/plant-species/transport/graphql/registries/plant-species-filterable-fields.registry';

describe('plantSpeciesFilterableFields', () => {
  const pipe = new FilterValidationPipe(plantSpeciesFilterableFields);

  it('has an entry for every PlantSpeciesQueryableField value', () => {
    for (const field of Object.values(PlantSpeciesQueryableField)) {
      expect(plantSpeciesFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts a LIKE filter on scientificName with a string value', () => {
    const input = {
      filters: [
        {
          field: PlantSpeciesQueryableField.SCIENTIFIC_NAME,
          operator: FilterOperator.LIKE,
          value: 'Rosa',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist', () => {
    const input = {
      filters: [
        { field: 'unknownField', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });
});
