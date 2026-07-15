import { FilterOperator } from '@sisques-labs/nestjs-kit';
import { FilterValidationPipe } from '@sisques-labs/nestjs-kit/graphql';

import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationQueryableField } from '@contexts/plant-identification/transport/graphql/enums/plant-identification-queryable-field.enum';
import { plantIdentificationFilterableFields } from './plant-identification-filterable-fields.registry';

describe('plantIdentificationFilterableFields', () => {
  const pipe = new FilterValidationPipe(plantIdentificationFilterableFields);

  it('has a registry entry for every PlantIdentificationQueryableField value', () => {
    for (const field of Object.values(PlantIdentificationQueryableField)) {
      expect(plantIdentificationFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts a valid enum filter on status', () => {
    const input = {
      filters: [
        {
          field: PlantIdentificationQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: PlantIdentificationStatusEnum.RESOLVED,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a filter on a field outside the whitelist (e.g. spaceId)', () => {
    const input = {
      filters: [
        { field: 'spaceId', operator: FilterOperator.EQUALS, value: 'x' },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/Unknown filter field/);
  });

  it('rejects an invalid enum value on status', () => {
    const input = {
      filters: [
        {
          field: PlantIdentificationQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: 'pending',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow();
  });
});
