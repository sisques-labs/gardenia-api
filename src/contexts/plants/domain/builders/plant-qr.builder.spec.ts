import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantQrBuilder } from './plant-qr.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const base = (): PlantQrBuilder =>
  new PlantQrBuilder()
    .withId(ID)
    .withSpaceId(SPACE_ID)
    .withTargetUrl('https://example.com/qr/123')
    .withGeneration(1)
    .withImage('data:image/png;base64,abc')
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantQrBuilder', () => {
  describe('buildViewModel()', () => {
    it('builds a view model with all fields', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.spaceId).toBe(SPACE_ID);
      expect(vm.targetUrl).toBe('https://example.com/qr/123');
      expect(vm.generation).toBe(1);
      expect(vm.image).toBe('data:image/png;base64,abc');
    });

    it('accepts a generation of zero', () => {
      expect(() => base().withGeneration(0).buildViewModel()).not.toThrow();
    });
  });

  describe('validate()', () => {
    it('throws when id is missing', () => {
      expect(() =>
        base()
          .withId(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when targetUrl is missing', () => {
      expect(() =>
        base()
          .withTargetUrl(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when image is missing', () => {
      expect(() =>
        base()
          .withImage(undefined as unknown as string)
          .buildViewModel(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
