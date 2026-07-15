import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationStatusValueObject } from './plant-identification-status.value-object';

describe('PlantIdentificationStatusValueObject', () => {
  it.each([
    PlantIdentificationStatusEnum.RESOLVED,
    PlantIdentificationStatusEnum.NO_MATCH,
  ])('accepts valid status: %s', (status) => {
    const vo = new PlantIdentificationStatusValueObject(status);
    expect(vo.value).toBe(status);
  });

  it('throws for an invalid status string', () => {
    expect(
      () =>
        new PlantIdentificationStatusValueObject(
          'pending' as PlantIdentificationStatusEnum,
        ),
    ).toThrow();
  });
});
