import { SpaceInvitationAggregate } from '@contexts/spaces/domain/aggregates/space-invitation.aggregate';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationEntity } from '../entities/space-invitation.entity';
import { SpaceInvitationTypeOrmMapper } from './space-invitation-typeorm.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_BY = '660e8400-e29b-41d4-a716-446655440001';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const EXPIRES_AT = new Date('2026-12-31T00:00:00.000Z');

const buildEntity = (
  overrides: Partial<SpaceInvitationEntity> = {},
): SpaceInvitationEntity => {
  const entity = new SpaceInvitationEntity();
  entity.id = ID;
  entity.spaceId = SPACE_ID;
  entity.createdByUserId = CREATED_BY;
  entity.role = MembershipRoleEnum.MEMBER;
  entity.code = 'SECRETCODE';
  entity.displayCode = 'ABC-123';
  entity.qrId = QR_ID;
  entity.expiresAt = EXPIRES_AT;
  entity.createdAt = CREATED_AT;
  entity.updatedAt = UPDATED_AT;
  return Object.assign(entity, overrides);
};

describe('SpaceInvitationTypeOrmMapper', () => {
  let mapper: SpaceInvitationTypeOrmMapper;

  beforeEach(() => {
    mapper = new SpaceInvitationTypeOrmMapper(new SpaceInvitationBuilder());
  });

  describe('toAggregate()', () => {
    it('wraps entity primitives into value objects', () => {
      const result = mapper.toAggregate(buildEntity());

      expect(result).toBeInstanceOf(SpaceInvitationAggregate);
      expect(result.id.value).toBe(ID);
      expect(result.spaceId.value).toBe(SPACE_ID);
      expect(result.role.value).toBe(MembershipRoleEnum.MEMBER);
      expect(result.code.value).toBe('SECRETCODE');
      expect(result.displayCode.value).toBe('ABC-123');
      expect(result.qrId?.value).toBe(QR_ID);
    });

    it('maps a null qrId', () => {
      const result = mapper.toAggregate(buildEntity({ qrId: null }));

      expect(result.qrId).toBeNull();
    });
  });

  describe('toEntity()', () => {
    it('serializes the aggregate into entity primitives', () => {
      const aggregate = mapper.toAggregate(buildEntity());

      const result = mapper.toEntity(aggregate);

      expect(result.id).toBe(ID);
      expect(result.spaceId).toBe(SPACE_ID);
      expect(result.role).toBe(MembershipRoleEnum.MEMBER);
      expect(result.code).toBe('SECRETCODE');
      expect(result.qrId).toBe(QR_ID);
    });
  });

  describe('toViewModel()', () => {
    it('maps entity primitives into a view model', () => {
      const vm = mapper.toViewModel(buildEntity());

      expect(vm.id).toBe(ID);
      expect(vm.displayCode).toBe('ABC-123');
      expect(vm.role).toBe(MembershipRoleEnum.MEMBER);
    });
  });
});
