import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotStatusValueObject } from '@contexts/planting-spots/domain/value-objects/planting-spot-status/planting-spot-status.value-object';

describe('PlantingSpotStatusValueObject', () => {
  describe('valid enum values', () => {
    it.each([PlantingSpotStatusEnum.ACTIVE, PlantingSpotStatusEnum.FALLOW])(
      'should accept valid status: %s',
      (status) => {
        const vo = new PlantingSpotStatusValueObject(status);
        expect(vo.value).toBe(status);
      },
    );
  });

  describe('invalid values', () => {
    it('should throw when given an invalid status string', () => {
      expect(
        () =>
          new PlantingSpotStatusValueObject(
            'dormant' as PlantingSpotStatusEnum,
          ),
      ).toThrow();
    });
  });
});
