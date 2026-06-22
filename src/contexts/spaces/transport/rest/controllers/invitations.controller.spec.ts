import { CommandBus } from '@nestjs/cqrs';

import { AcceptSpaceInvitationCommand } from '@contexts/spaces/application/commands/accept-space-invitation/accept-space-invitation.command';
import { ResolveInvitationSpaceContextService } from '@contexts/spaces/application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { SpaceInvitationRestMapper } from '../mappers/space-invitation/space-invitation.mapper';
import { InvitationsController } from './invitations.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const user = { userId: USER_ID } as CurrentUserPayload;

describe('InvitationsController', () => {
  let controller: InvitationsController;
  let commandBus: jest.Mocked<CommandBus>;
  let mapper: jest.Mocked<SpaceInvitationRestMapper>;
  let resolveContext: jest.Mocked<ResolveInvitationSpaceContextService>;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mapper = {
      toAcceptResponse: jest.fn((userId, spaceId) => ({ userId, spaceId })),
    } as unknown as jest.Mocked<SpaceInvitationRestMapper>;
    resolveContext = {
      run: jest.fn((_code: string, fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<ResolveInvitationSpaceContextService>;
    controller = new InvitationsController(commandBus, mapper, resolveContext);
  });

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
