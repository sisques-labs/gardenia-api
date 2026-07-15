import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationOrganValueObject } from './plant-identification-organ.value-object';

describe('PlantIdentificationOrganValueObject', () => {
  it.each([
    PlantIdentificationOrganEnum.LEAF,
    PlantIdentificationOrganEnum.FLOWER,
    PlantIdentificationOrganEnum.FRUIT,
    PlantIdentificationOrganEnum.BARK,
    PlantIdentificationOrganEnum.HABIT,
    PlantIdentificationOrganEnum.OTHER,
  ])('accepts valid organ: %s', (organ) => {
    const vo = new PlantIdentificationOrganValueObject(organ);
    expect(vo.value).toBe(organ);
  });

  it('throws for an invalid organ (e.g. "stem")', () => {
    expect(
      () =>
        new PlantIdentificationOrganValueObject(
          'stem' as PlantIdentificationOrganEnum,
        ),
    ).toThrow();
  });
});
