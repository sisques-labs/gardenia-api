import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceInvitationViewModel } from '@contexts/spaces/domain/view-models/space-invitation.view-model';
import { SpaceInvitationGraphQLMapper } from './space-invitation.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CREATED_BY = '660e8400-e29b-41d4-a716-446655440001';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';
const NOW = new Date('2026-01-01T00:00:00.000Z');
const EXPIRES_AT = new Date('2026-12-31T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<SpaceInvitationViewModel> = {},
): SpaceInvitationViewModel =>
  new SpaceInvitationViewModel({
    id: ID,
    spaceId: SPACE_ID,
    createdByUserId: CREATED_BY,
    role: MembershipRoleEnum.MEMBER,
    code: 'SECRETCODE',
    displayCode: 'ABC-123',
    qrId: QR_ID,
    expiresAt: EXPIRES_AT,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('SpaceInvitationGraphQLMapper', () => {
  let mapper: SpaceInvitationGraphQLMapper;

  beforeEach(() => {
    mapper = new SpaceInvitationGraphQLMapper();
  });

  it('maps the invitation view model to a response object', () => {
    const dto = mapper.toResponse(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.displayCode).toBe('ABC-123');
    expect(dto.code).toBe('SECRETCODE');
    expect(dto.qrId).toBe(QR_ID);
    expect(dto.expiresAt).toBe(EXPIRES_AT);
    expect(dto.role).toBe(MembershipRoleEnum.MEMBER);
    expect(dto.spaceId).toBe(SPACE_ID);
  });

  it('maps a null qrId', () => {
    const dto = mapper.toResponse(buildViewModel({ qrId: null }));

    expect(dto.qrId).toBeNull();
  });

  describe('toPreviewResponse()', () => {
    it('maps the preview view model to a response object', () => {
      const dto = mapper.toPreviewResponse({
        spaceName: 'Greenhouse A',
        role: MembershipRoleEnum.MEMBER,
        expiresAt: EXPIRES_AT,
        isExpired: false,
      });

      expect(dto).toEqual({
        spaceName: 'Greenhouse A',
        role: MembershipRoleEnum.MEMBER,
        expiresAt: EXPIRES_AT,
        isExpired: false,
      });
    });
  });
});
