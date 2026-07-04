import { FilterOperator, FilterValidationPipe } from '@sisques-labs/nestjs-kit';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotQueryableField } from '@contexts/planting-spots/transport/graphql/enums/planting-spot-queryable-field.enum';
import { plantingSpotFilterableFields } from '@contexts/planting-spots/transport/graphql/registries/planting-spot-filterable-fields.registry';

describe('plantingSpotFilterableFields', () => {
  const pipe = new FilterValidationPipe(plantingSpotFilterableFields);

  it('has an entry for every PlantingSpotQueryableField value', () => {
    for (const field of Object.values(PlantingSpotQueryableField)) {
      expect(plantingSpotFilterableFields[field]).toBeDefined();
    }
  });

  it('accepts an EQUALS filter on type with a real PlantingSpotTypeEnum value', () => {
    const input = {
      filters: [
        {
          field: PlantingSpotQueryableField.TYPE,
          operator: FilterOperator.EQUALS,
          value: PlantingSpotTypeEnum.RAISED_BED,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a type value outside PlantingSpotTypeEnum', () => {
    const input = {
      filters: [
        {
          field: PlantingSpotQueryableField.TYPE,
          operator: FilterOperator.EQUALS,
          value: 'greenhouse',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('accepts an EQUALS filter on status with a real PlantingSpotStatusEnum value', () => {
    const input = {
      filters: [
        {
          field: PlantingSpotQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: PlantingSpotStatusEnum.FALLOW,
        },
      ],
    };

    expect(() => pipe.transform(input)).not.toThrow();
  });

  it('rejects a status value outside PlantingSpotStatusEnum', () => {
    const input = {
      filters: [
        {
          field: PlantingSpotQueryableField.STATUS,
          operator: FilterOperator.EQUALS,
          value: 'dormant',
        },
      ],
    };

    expect(() => pipe.transform(input)).toThrow(/expected one of/);
  });

  it('accepts a GREATER_THAN_OR_EQUAL filter on capacity with a number value', () => {
    const input = {
      filters: [
        {
          field: PlantingSpotQueryableField.CAPACITY,
          operator: FilterOperator.GREATER_THAN_OR_EQUAL,
          value: 5,
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
});
