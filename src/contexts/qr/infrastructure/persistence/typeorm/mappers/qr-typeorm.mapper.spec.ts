import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';
import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrTypeOrmEntity } from '@contexts/qr/infrastructure/persistence/typeorm/entities/qr.entity';
import { QrTypeOrmMapper } from './qr-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const EXPIRES_AT = new Date('2026-12-31T00:00:00.000Z');

const buildEntity = (): QrTypeOrmEntity => {
  const entity = new QrTypeOrmEntity();
  entity.id = ID;
  entity.spaceId = SPACE_ID;
  entity.targetUrl = 'https://example.com/qr/1';
  entity.pngImage = Buffer.from('png');
  entity.generation = 2;
  entity.expiresAt = EXPIRES_AT;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

describe('QrTypeOrmMapper', () => {
  let mapper: QrTypeOrmMapper;

  beforeEach(() => {
    mapper = new QrTypeOrmMapper(new QrBuilder());
  });

  describe('toAggregate()', () => {
    it('wraps entity primitives into value objects', () => {
      const result = mapper.toAggregate(buildEntity());

      expect(result).toBeInstanceOf(QrAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.spaceId.value).toBe(SPACE_ID);
      expect(result.targetUrl.value).toBe('https://example.com/qr/1');
      expect(result.generation.value).toBe(2);
      expect(result.expiresAt?.value).toEqual(EXPIRES_AT);
    });
  });

  describe('toEntity()', () => {
    it('maps the aggregate plus the provided PNG buffer', () => {
      const aggregate = mapper.toAggregate(buildEntity());
      const png = Buffer.from('new-png');

      const result = mapper.toEntity(aggregate, png);

      expect(result).toBeInstanceOf(QrTypeOrmEntity);
      expect(result.id).toBe(ID);
      expect(result.targetUrl).toBe('https://example.com/qr/1');
      expect(result.generation).toBe(2);
      expect(result.pngImage).toBe(png);
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.targetUrl).toBe('https://example.com/qr/1');
      expect(vm.generation).toBe(2);
    });
  });

  describe('round-trip', () => {
    it('preserves scalar fields through toAggregate → toEntity', () => {
      const original = buildEntity();

      const result = mapper.toEntity(
        mapper.toAggregate(original),
        original.pngImage,
      );

      expect(result.id).toBe(original.id);
      expect(result.spaceId).toBe(original.spaceId);
      expect(result.targetUrl).toBe(original.targetUrl);
      expect(result.generation).toBe(original.generation);
      expect(result.createdAt).toEqual(original.createdAt);
      expect(result.updatedAt).toEqual(original.updatedAt);
    });
  });
});
