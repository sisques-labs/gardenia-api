import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationBuilder } from './plant-identification.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');

const PHOTOS = [
  {
    fileId: FILE_ID,
    url: '/api/files/330e8400/content',
    organ: PlantIdentificationOrganEnum.LEAF,
    position: 0,
  },
];

const CANDIDATES = [
  {
    scientificName: 'Monstera deliciosa',
    commonNames: ['Swiss cheese plant'],
    score: 0.85,
    rank: 0,
  },
];

const base = (): PlantIdentificationBuilder =>
  new PlantIdentificationBuilder()
    .withId(ID)
    .withRequestedByUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withResolved({
      speciesKey: 2882337,
      scientificName: 'Monstera deliciosa',
      provider: 'gbif',
    })
    .withPhotos(PHOTOS)
    .withCandidates(CANDIDATES)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('PlantIdentificationBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with all fields wrapped in value objects', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.requestedByUserId.value).toBe(USER_ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
      expect(aggregate.status.value).toBe(
        PlantIdentificationStatusEnum.RESOLVED,
      );
      expect(aggregate.resolvedSpeciesKey?.value).toBe(2882337);
      expect(aggregate.resolvedScientificName?.value).toBe(
        'Monstera deliciosa',
      );
      expect(aggregate.resolvedSpeciesProvider?.value).toBe('gbif');
      expect(aggregate.photos).toHaveLength(1);
      expect(aggregate.candidates).toHaveLength(1);
    });

    it('derives status NO_MATCH and leaves resolved fields null when withResolved(null)', () => {
      const aggregate = base().withResolved(null).build();

      expect(aggregate.status.value).toBe(
        PlantIdentificationStatusEnum.NO_MATCH,
      );
      expect(aggregate.resolvedSpeciesKey).toBeNull();
      expect(aggregate.resolvedScientificName).toBeNull();
      expect(aggregate.resolvedSpeciesProvider).toBeNull();
    });

    it('sets convertedToPlantId when provided', () => {
      const plantId = '440e8400-e29b-41d4-a716-446655440003';
      const aggregate = base().withConvertedToPlantId(plantId).build();

      expect(aggregate.convertedToPlantId?.value).toBe(plantId);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.requestedByUserId).toBe(USER_ID);
      expect(vm.status).toBe(PlantIdentificationStatusEnum.RESOLVED);
      expect(vm.resolvedSpeciesProvider).toBe('gbif');
      expect(vm.photos).toEqual(PHOTOS);
      expect(vm.candidates).toEqual(CANDIDATES);
    });

    it('derives status NO_MATCH when withResolved(null)', () => {
      const vm = base().withResolved(null).buildViewModel();

      expect(vm.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    });
  });

  describe('validate()', () => {
    it('throws when requestedByUserId is missing', () => {
      expect(() =>
        base()
          .withRequestedByUserId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when spaceId is missing', () => {
      expect(() =>
        base()
          .withSpaceId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when id is missing (base builder validation)', () => {
      expect(() =>
        new PlantIdentificationBuilder()
          .withRequestedByUserId(USER_ID)
          .withSpaceId(SPACE_ID)
          .withCreatedAt(CREATED_AT)
          .withUpdatedAt(UPDATED_AT)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
