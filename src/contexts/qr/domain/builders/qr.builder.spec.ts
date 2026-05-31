import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';

import { QrBuilder } from './qr.builder';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const TARGET_URL = 'http://localhost:3000/plants/example?spaceId=abc';
const NOW = new Date('2024-01-01');

const buildFull = (builder: QrBuilder) =>
  builder
    .withId(QR_ID)
    .withSpaceId(SPACE_ID)
    .withTargetUrl(TARGET_URL)
    .withGeneration(1)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW);

describe('QrBuilder', () => {
  let builder: QrBuilder;

  beforeEach(() => {
    builder = new QrBuilder();
  });

  describe('build()', () => {
    it('returns a QrAggregate with the provided values', () => {
      const aggregate = buildFull(builder).build();

      expect(aggregate).toBeInstanceOf(QrAggregate);
      expect(aggregate.id.value).toBe(QR_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
      expect(aggregate.targetUrl.value).toBe(TARGET_URL);
      expect(aggregate.generation).toBe(1);
    });

    it('throws FieldIsRequiredException when spaceId is missing', () => {
      builder
        .withId(QR_ID)
        .withTargetUrl(TARGET_URL)
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW);

      expect(() => builder.build()).toThrow(FieldIsRequiredException);
    });

    it('throws FieldIsRequiredException when targetUrl is missing', () => {
      builder
        .withId(QR_ID)
        .withSpaceId(SPACE_ID)
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW);

      expect(() => builder.build()).toThrow(FieldIsRequiredException);
    });
  });

  describe('buildViewModel()', () => {
    it('returns a QrViewModel with the provided values', () => {
      const vm = buildFull(builder).buildViewModel();

      expect(vm).toBeInstanceOf(QrViewModel);
      expect(vm.id).toBe(QR_ID);
      expect(vm.spaceId).toBe(SPACE_ID);
      expect(vm.targetUrl).toBe(TARGET_URL);
      expect(vm.generation).toBe(1);
    });
  });

  describe('withGeneration()', () => {
    it('defaults generation to 1 when not set', () => {
      const aggregate = buildFull(builder).build();

      expect(aggregate.generation).toBe(1);
    });

    it('uses the provided generation value', () => {
      const aggregate = buildFull(builder).withGeneration(5).build();

      expect(aggregate.generation).toBe(5);
    });
  });
});
