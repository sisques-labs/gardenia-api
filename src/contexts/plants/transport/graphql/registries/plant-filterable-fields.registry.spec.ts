import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { PlantQueryableField } from '@contexts/plants/transport/graphql/enums/plant/plant-queryable-field.enum';
import { plantFilterableFields } from '@contexts/plants/transport/graphql/registries/plant-filterable-fields.registry';

describe('plantFilterableFields', () => {
  const pipe = new FilterValidationPipe(plantFilterableFields);

  it('has an entry for every PlantQueryableField value', () => {
    for (const field of Object.values(PlantQueryableField)) {
      expect(plantFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts a LIKE filter on name with a string value', () => {
    const input = {
      filters: [
        {
          field: PlantQueryableField.NAME,
          operator: FilterOperator.LIKE,
          value: 'rose',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts an EQUALS filter on plantSpeciesId with a uuid string', () => {
    const input = {
      filters: [
        {
          field: PlantQueryableField.PLANT_SPECIES_ID,
          operator: FilterOperator.EQUALS,
          value: 'a3f1b2c4-0000-4000-8000-000000000000',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts an IN filter on plantingSpotId with an array of uuid strings', () => {
    const input = {
      filters: [
        {
          field: PlantQueryableField.PLANTING_SPOT_ID,
          operator: FilterOperator.IN,
          value: [
            'a3f1b2c4-0000-4000-8000-000000000000',
            'b4a2c3d5-0000-4000-8000-000000000001',
          ],
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('accepts a GREATER_THAN filter on createdAt with an ISO date string', () => {
    const input = {
      filters: [
        {
          field: PlantQueryableField.CREATED_AT,
          operator: FilterOperator.GREATER_THAN,
          value: '2026-01-01T00:00:00.000Z',
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist', () => {
    const input = {
      filters: [
        { field: 'userId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });

  it('rejects a non-string value on the name filter', () => {
    const input = {
      filters: [
        {
          field: PlantQueryableField.NAME,
          operator: FilterOperator.EQUALS,
          value: 42,
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow();
  });
});
