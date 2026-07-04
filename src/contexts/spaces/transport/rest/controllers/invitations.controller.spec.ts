import { CommandBus, QueryBus } from '@nestjs/cqrs';

import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { SpaceInvitationPreviewFindByCodeQuery } from '@contexts/spaces/application/queries/space-invitation-preview-find-by-code/space-invitation-preview-find-by-code.query';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';
import { InvitationsController } from './invitations.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const user = { userId: USER_ID } as CurrentUserPayload;

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<SpaceInvitationRestMapper>;
  let resolveContext: jest.Mocked<ResolveInvitationSpaceContextService>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toAcceptResponse: jest.fn((userId, spaceId) => ({ userId, spaceId })),
      toPreviewResponse: jest.fn((vm) => vm),
    } as unknown as jest.Mocked<SpaceInvitationRestMapper>;
    resolveContext = {
      run: jest.fn((_code: string, fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<ResolveInvitationSpaceContextService>;
    controller = new InvitationsController(
      commandBus,
      queryBus,
      mapper,
      resolveContext,
    );
  });

  describe('acceptInvitation()', () => {
    it('accepts the invitation within the resolved space context and maps the response', async () => {
      commandBus.execute.mockResolvedValue(SPACE_ID);

      const result = await controller.acceptInvitation(
        { code: 'SECRETCODE' } as never,
        user,
      );

      expect(resolveContext.run).toHaveBeenCalledWith(
        'SECRETCODE',
        expect.any(Function),
      );
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(AcceptSpaceInvitationCommand),
      );
      expect(mapper.toAcceptResponse).toHaveBeenCalledWith(USER_ID, SPACE_ID);
      expect(result).toEqual({ userId: USER_ID, spaceId: SPACE_ID });
    });
  });

  describe('getPreview()', () => {
    it('dispatches the preview query and maps the response, without a space context', async () => {
      const preview = {
        spaceName: 'Greenhouse A',
        role: MembershipRoleEnum.MEMBER,
        expiresAt: new Date('2026-12-31T00:00:00.000Z'),
        isExpired: false,
      };
      queryBus.execute.mockResolvedValue(preview);

      const result = await controller.getPreview('SECRETCODE');

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(SpaceInvitationPreviewFindByCodeQuery),
      );
      expect(resolveContext.run).not.toHaveBeenCalled();
      expect(mapper.toPreviewResponse).toHaveBeenCalledWith(preview);
      expect(result).toBe(preview);
    });
  });
});
