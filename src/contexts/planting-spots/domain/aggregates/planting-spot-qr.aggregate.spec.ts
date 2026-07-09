import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UrlValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotQrAggregate } from './planting-spot-qr.aggregate';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const TARGET_URL = 'https://gardenia.app/planting-spots/550e8400';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildAggregate = (): PlantingSpotQrAggregate =>
  new PlantingSpotQrAggregate({
    id: new UuidValueObject(ID),
    spaceId: new UuidValueObject(SPACE_ID),
    targetUrl: new UrlValueObject(TARGET_URL),
    generation: new NumberValueObject(1),
    image: new StringValueObject('data:image/png;base64,abc'),
    createdAt: new DateValueObject(NOW),
    updatedAt: new DateValueObject(NOW),
  });

describe('PlantingSpotQrAggregate', () => {
  it('exposes all fields via getters', () => {
    const qr = buildAggregate();

    expect(qr.id.value).toBe(ID);
    expect(qr.spaceId.value).toBe(SPACE_ID);
    expect(qr.targetUrl.value).toBe(TARGET_URL);
    expect(qr.generation.value).toBe(1);
    expect(qr.image.value).toBe('data:image/png;base64,abc');
    expect(qr.createdAt.value).toBe(NOW);
    expect(qr.updatedAt.value).toBe(NOW);
  });

  it('serializes to primitives', () => {
    const qr = buildAggregate();

    expect(qr.toPrimitives()).toEqual({
      id: ID,
      spaceId: SPACE_ID,
      targetUrl: TARGET_URL,
      generation: 1,
      image: 'data:image/png;base64,abc',
      createdAt: NOW,
      updatedAt: NOW,
    });
  });
});
