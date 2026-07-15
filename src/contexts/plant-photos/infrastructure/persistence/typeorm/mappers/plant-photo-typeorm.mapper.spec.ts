import { PlantPhotoBuilder } from '@contexts/plant-photos/domain/builders/plant-photo.builder';
import { PlantPhotoTypeOrmEntity } from '../entities/plant-photo.entity';
import { PlantPhotoTypeOrmMapper } from './plant-photo-typeorm.mapper';

function buildEntity(): PlantPhotoTypeOrmEntity {
  const entity = new PlantPhotoTypeOrmEntity();
  entity.id = '550e8400-e29b-41d4-a716-446655440000';
  entity.plantId = '440e8400-e29b-41d4-a716-446655440003';
  entity.fileId = '330e8400-e29b-41d4-a716-446655440004';
  entity.url = '/api/files/330e8400/content';
  entity.userId = '660e8400-e29b-41d4-a716-446655440001';
  entity.spaceId = '770e8400-e29b-41d4-a716-446655440002';
  entity.createdAt = new Date('2026-01-01T00:00:00.000Z');
  entity.updatedAt = new Date('2026-01-02T00:00:00.000Z');
  return entity;
}

describe('PlantPhotoTypeOrmMapper', () => {
  const mapper = new PlantPhotoTypeOrmMapper(new PlantPhotoBuilder());

  it('toDomain() builds an aggregate matching the entity', () => {
    const entity = buildEntity();
    const aggregate = mapper.toDomain(entity);

    expect(aggregate.id.value).toBe(entity.id);
    expect(aggregate.plantId.value).toBe(entity.plantId);
    expect(aggregate.fileId.value).toBe(entity.fileId);
    expect(aggregate.url.value).toBe(entity.url);
  });

  it('toPersistence() round-trips the aggregate back to an entity', () => {
    const entity = buildEntity();
    const aggregate = mapper.toDomain(entity);
    const persisted = mapper.toPersistence(aggregate);

    expect(persisted).toMatchObject({
      id: entity.id,
      plantId: entity.plantId,
      fileId: entity.fileId,
      url: entity.url,
      userId: entity.userId,
      spaceId: entity.spaceId,
    });
  });

  it('toViewModel() builds a view model matching the entity', () => {
    const entity = buildEntity();
    const vm = mapper.toViewModel(entity);

    expect(vm.id).toBe(entity.id);
    expect(vm.plantId).toBe(entity.plantId);
    expect(vm.url).toBe(entity.url);
  });
});
