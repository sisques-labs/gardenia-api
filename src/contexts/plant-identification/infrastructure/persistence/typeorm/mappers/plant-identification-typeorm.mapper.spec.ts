import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from './plant-identification-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';

function buildParent(): PlantIdentificationTypeOrmEntity {
  const entity = new PlantIdentificationTypeOrmEntity();
  entity.id = ID;
  entity.requestedByUserId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.status = PlantIdentificationStatusEnum.RESOLVED;
  entity.resolvedGbifKey = 2882337;
  entity.resolvedScientificName = 'Monstera deliciosa';
  entity.convertedToPlantId = null;
  entity.createdAt = new Date('2026-01-01T00:00:00.000Z');
  entity.updatedAt = new Date('2026-01-02T00:00:00.000Z');
  return entity;
}

function buildPhoto(position = 0): PlantIdentificationPhotoTypeOrmEntity {
  const entity = new PlantIdentificationPhotoTypeOrmEntity();
  entity.id = 'photo-1';
  entity.plantIdentificationId = ID;
  entity.fileId = FILE_ID;
  entity.url = '/api/files/330e8400/content';
  entity.organ = PlantIdentificationOrganEnum.LEAF;
  entity.position = position;
  return entity;
}

function buildCandidate(rank = 0): PlantIdentificationCandidateTypeOrmEntity {
  const entity = new PlantIdentificationCandidateTypeOrmEntity();
  entity.id = 'candidate-1';
  entity.plantIdentificationId = ID;
  entity.scientificName = 'Monstera deliciosa';
  entity.commonNames = ['Swiss cheese plant'];
  entity.score = 0.85;
  entity.rank = rank;
  return entity;
}

describe('PlantIdentificationTypeOrmMapper', () => {
  const mapper = new PlantIdentificationTypeOrmMapper(
    new PlantIdentificationBuilder(),
  );

  it('toDomain() builds an aggregate matching the entities, sorted by position/rank', () => {
    const parent = buildParent();
    const photos = [buildPhoto(1), buildPhoto(0)];
    const candidates = [buildCandidate(1), buildCandidate(0)];

    const aggregate = mapper.toDomain(parent, photos, candidates);

    expect(aggregate.id.value).toBe(ID);
    expect(aggregate.resolvedGbifKey?.value).toBe(2882337);
    expect(aggregate.photos.map((p) => p.position.value)).toEqual([0, 1]);
    expect(aggregate.candidates.map((c) => c.rank.value)).toEqual([0, 1]);
  });

  it('toDomain() leaves resolved fields null when not resolved', () => {
    const parent = buildParent();
    parent.status = PlantIdentificationStatusEnum.NO_MATCH;
    parent.resolvedGbifKey = null;
    parent.resolvedScientificName = null;

    const aggregate = mapper.toDomain(parent, [], []);

    expect(aggregate.resolvedGbifKey).toBeNull();
    expect(aggregate.resolvedScientificName).toBeNull();
  });

  it('toPersistence() round-trips the aggregate back to entities', () => {
    const parent = buildParent();
    const aggregate = mapper.toDomain(
      parent,
      [buildPhoto()],
      [buildCandidate()],
    );

    const persisted = mapper.toPersistence(aggregate);

    expect(persisted.parent).toMatchObject({
      id: ID,
      requestedByUserId: USER_ID,
      spaceId: SPACE_ID,
      status: PlantIdentificationStatusEnum.RESOLVED,
      resolvedGbifKey: 2882337,
    });
    expect(persisted.photos).toHaveLength(1);
    expect(persisted.photos[0]).toMatchObject({
      plantIdentificationId: ID,
      fileId: FILE_ID,
    });
    expect(persisted.candidates).toHaveLength(1);
    expect(persisted.candidates[0]).toMatchObject({
      plantIdentificationId: ID,
      scientificName: 'Monstera deliciosa',
    });
  });

  it('toViewModel() builds a view model matching the entities', () => {
    const vm = mapper.toViewModel(
      buildParent(),
      [buildPhoto()],
      [buildCandidate()],
    );

    expect(vm.id).toBe(ID);
    expect(vm.status).toBe(PlantIdentificationStatusEnum.RESOLVED);
    expect(vm.photos).toHaveLength(1);
    expect(vm.candidates).toHaveLength(1);
  });
});
