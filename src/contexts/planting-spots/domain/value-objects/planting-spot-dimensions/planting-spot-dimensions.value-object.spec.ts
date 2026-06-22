import { PlantingSpotDimensionsValueObject } from './planting-spot-dimensions.value-object';

describe('PlantingSpotDimensionsValueObject', () => {
  it('stores the provided dimensions', () => {
    const vo = new PlantingSpotDimensionsValueObject({
      width: 100,
      height: 50,
      length: 200,
    });

    expect(vo.width).toBe(100);
    expect(vo.height).toBe(50);
    expect(vo.length).toBe(200);
  });

  it('defaults missing dimensions to null', () => {
    const vo = new PlantingSpotDimensionsValueObject({ width: 100 });

    expect(vo.width).toBe(100);
    expect(vo.height).toBeNull();
    expect(vo.length).toBeNull();
  });

  it('defaults all dimensions to null when no props are given', () => {
    const vo = new PlantingSpotDimensionsValueObject();

    expect(vo.width).toBeNull();
    expect(vo.height).toBeNull();
    expect(vo.length).toBeNull();
  });

  it('coerces explicit null props to null', () => {
    const vo = new PlantingSpotDimensionsValueObject({
      width: null,
      height: null,
      length: null,
    });

    expect(vo.width).toBeNull();
    expect(vo.height).toBeNull();
    expect(vo.length).toBeNull();
  });
});
