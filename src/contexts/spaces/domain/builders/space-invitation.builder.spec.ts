import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationBuilder } from './space-invitation.builder';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_BY = '660e8400-e29b-41d4-a716-446655440001';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
const UPDATED_AT = new Date('2026-01-02T00:00:00.000Z');
const EXPIRES_AT = new Date('2026-12-31T00:00:00.000Z');

const base = (): SpaceInvitationBuilder =>
  new SpaceInvitationBuilder()
    .withId(ID)
    .withSpaceId(SPACE_ID)
    .withCreatedByUserId(CREATED_BY)
    .withCode('SECRETCODE')
    .withDisplayCode('ABC-123')
    .withExpiresAt(EXPIRES_AT)
    .withCreatedAt(CREATED_AT)
    .withUpdatedAt(UPDATED_AT);

describe('SpaceInvitationBuilder', () => {
  describe('build()', () => {
    it('builds an aggregate with required fields and defaults', () => {
      const aggregate = base().build();

      expect(aggregate.id.value).toBe(ID);
      expect(aggregate.spaceId.value).toBe(SPACE_ID);
      expect(aggregate.createdByUserId.value).toBe(CREATED_BY);
      expect(aggregate.code.value).toBe('SECRETCODE');
      expect(aggregate.displayCode.value).toBe('ABC-123');
      expect(aggregate.expiresAt.value).toBe(EXPIRES_AT);
      expect(aggregate.role.value).toBe(MembershipRoleEnum.MEMBER);
      expect(aggregate.qrId).toBeNull();
    });

    it('wraps a custom role and qrId when provided', () => {
      const aggregate = base()
        .withRole(MembershipRoleEnum.OWNER)
        .withQrId(QR_ID)
        .build();

      expect(aggregate.role.value).toBe(MembershipRoleEnum.OWNER);
      expect(aggregate.qrId?.value).toBe(QR_ID);
    });
  });

  describe('buildViewModel()', () => {
    it('builds a view model with primitive values', () => {
      const vm = base().buildViewModel();

      expect(vm.id).toBe(ID);
      expect(vm.spaceId).toBe(SPACE_ID);
      expect(vm.displayCode).toBe('ABC-123');
      expect(vm.role).toBe(MembershipRoleEnum.MEMBER);
      expect(vm.qrId).toBeNull();
    });
  });

  describe('validate()', () => {
    it('throws when spaceId is missing', () => {
      expect(() =>
        base()
          .withSpaceId(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when code is missing', () => {
      expect(() =>
        base()
          .withCode(undefined as unknown as string)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });

    it('throws when expiresAt is missing', () => {
      expect(() =>
        base()
          .withExpiresAt(undefined as unknown as Date)
          .build(),
      ).toThrow(FieldIsRequiredException);
    });
  });
});
