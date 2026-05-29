import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceMembershipEntity } from '../entities/space-membership.entity';
import { SpaceMembershipBuilder } from '@contexts/spaces/domain/builders/space-membership.builder';
import { SpaceMembershipTypeOrmMapper } from './space-membership-typeorm.mapper';

const MEMBERSHIP_ID = '550e8400-e29b-41d4-a716-446655440010';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440003';
const JOINED_AT = new Date('2024-01-01T00:00:00.000Z');

const buildEntity = (): SpaceMembershipEntity => {
  const entity = new SpaceMembershipEntity();
  entity.id = MEMBERSHIP_ID;
  entity.spaceId = SPACE_ID;
  entity.userId = USER_ID;
  entity.role = MembershipRoleEnum.OWNER;
  entity.joinedAt = JOINED_AT;
  return entity;
};

describe('SpaceMembershipTypeOrmMapper', () => {
  let mapper: SpaceMembershipTypeOrmMapper;

  beforeEach(() => {
    mapper = new SpaceMembershipTypeOrmMapper(new SpaceMembershipBuilder());
  });

  describe('toDomain()', () => {
    it('should return a SpaceMembership from entity', () => {
      const entity = buildEntity();

      const result = mapper.toDomain(entity);

      expect(result.userId).toBe(entity.userId);
      expect(result.spaceId).toBe(entity.spaceId);
      expect(result.role.value).toBe(entity.role);
      expect(result.joinedAt).toEqual(entity.joinedAt);
    });

    it('should map member role correctly', () => {
      const entity = buildEntity();
      entity.role = MembershipRoleEnum.MEMBER;

      const result = mapper.toDomain(entity);

      expect(result.role.value).toBe(MembershipRoleEnum.MEMBER);
      expect(result.role.isOwner()).toBe(false);
    });

    it('should map owner role correctly', () => {
      const entity = buildEntity();
      entity.role = MembershipRoleEnum.OWNER;

      const result = mapper.toDomain(entity);

      expect(result.role.isOwner()).toBe(true);
    });
  });

  describe('toPersistence()', () => {
    it('should return a Partial<SpaceMembershipEntity> with plain values', () => {
      const entity = buildEntity();
      const membership = mapper.toDomain(entity);

      const result = mapper.toPersistence(membership);

      expect(result.userId).toBe(entity.userId);
      expect(result.spaceId).toBe(entity.spaceId);
      expect(result.role).toBe(entity.role);
      expect(result.joinedAt).toEqual(entity.joinedAt);
    });
  });

  describe('round-trip (toDomain → toPersistence)', () => {
    it('should produce a partial entity equal to the original', () => {
      const original = buildEntity();

      const membership = mapper.toDomain(original);
      const result = mapper.toPersistence(membership);

      expect(result.userId).toBe(original.userId);
      expect(result.spaceId).toBe(original.spaceId);
      expect(result.role).toBe(original.role);
      expect(result.joinedAt).toEqual(original.joinedAt);
    });
  });
});
