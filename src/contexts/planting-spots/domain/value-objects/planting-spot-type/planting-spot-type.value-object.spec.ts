import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotTypeValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-type/planting-spot-type.value-object';

describe('PlantingSpotTypeValueObject', () => {
  describe('valid enum values', () => {
    it.each([
      PlantingSpotTypeEnum.RAISED_BED,
      PlantingSpotTypeEnum.POT,
      PlantingSpotTypeEnum.CONTAINER,
      PlantingSpotTypeEnum.FIELD_SECTION,
      PlantingSpotTypeEnum.OTHER,
    ])('should accept valid type: %s', (type) => {
      const vo = new PlantingSpotTypeValueObject(type);
      expect(vo.value).toBe(type);
    });
  });

  describe('invalid values', () => {
    it('should throw when given an invalid type string', () => {
      expect(
        () =>
          new PlantingSpotTypeValueObject('greenhouse' as PlantingSpotTypeEnum),
      ).toThrow();
    });

    it('should throw when given another arbitrary invalid string', () => {
      expect(
        () =>
          new PlantingSpotTypeValueObject('balcony' as PlantingSpotTypeEnum),
      ).toThrow();
    });
  });
});
