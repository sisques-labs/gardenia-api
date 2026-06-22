import { HarvestAggregate } from '@contexts/harvests/domain/aggregates/harvest.aggregate';
import { HarvestBuilder } from '@contexts/harvests/domain/builders/harvest.builder';
import { HarvestUnitEnum } from '@contexts/harvests/domain/enums/harvest-unit.enum';
import { HarvestTypeOrmEntity } from '../entities/harvest.entity';
import { HarvestTypeOrmMapper } from './harvest-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const HARVESTED_AT = new Date('2026-01-03T00:00:00.000Z');

const buildEntity = (): HarvestTypeOrmEntity => {
  const entity = new HarvestTypeOrmEntity();
  entity.id = ID;
  entity.cropType = 'Tomato';
  entity.quantity = '2.5';
  entity.unit = HarvestUnitEnum.KG;
  entity.harvestedAt = HARVESTED_AT;
  entity.userId = USER_ID;
  entity.spaceId = SPACE_ID;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return entity;
};

describe('HarvestTypeOrmMapper', () => {
  let mapper: HarvestTypeOrmMapper;

  beforeEach(() => {
    mapper = new HarvestTypeOrmMapper(new HarvestBuilder());
  });

  describe('toDomain()', () => {
    it('wraps entity primitives and parses the numeric quantity string', () => {
      const result = mapper.toDomain(buildEntity());

      expect(result).toBeInstanceOf(HarvestAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.cropType.value).toBe('Tomato');
      expect(result.quantity.value).toBe(2.5);
      expect(result.unit.value).toBe(HarvestUnitEnum.KG);
    });
  });

  describe('toPersistence()', () => {
    it('serializes the aggregate, stringifying the quantity', () => {
      const aggregate = mapper.toDomain(buildEntity());

      const result = mapper.toPersistence(aggregate);

      expect(result).toBeInstanceOf(HarvestTypeOrmEntity);
      expect(result.id).toBe(ID);
      expect(result.quantity).toBe('2.5');
      expect(typeof result.quantity).toBe('string');
      expect(result.unit).toBe(HarvestUnitEnum.KG);
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.quantity).toBe(2.5);
      expect(vm.cropType).toBe('Tomato');
    });
  });

  describe('round-trip', () => {
    it('preserves quantity precision through toDomain → toPersistence', () => {
      const original = buildEntity();

      const result = mapper.toPersistence(mapper.toDomain(original));

      expect(result.quantity).toBe(original.quantity);
      expect(result.cropType).toBe(original.cropType);
      expect(result.harvestedAt).toEqual(original.harvestedAt);
    });
  });
});
