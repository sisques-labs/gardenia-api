import { AssertSpaceInvitationViewModelExistsByCodeService } from '@contexts/spaces/application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { ResolveInvitationSpaceContextService } from './resolve-invitation-space-context.service';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CODE = 'SECRETCODE';

describe('ResolveInvitationSpaceContextService', () => {
  let service: ResolveInvitationSpaceContextService;
  let assertInvitation: jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    assertInvitation = {
      execute: jest.fn().mockResolvedValue({ spaceId: SPACE_ID }),
    } as unknown as jest.Mocked<AssertSpaceInvitationViewModelExistsByCodeService>;
    spaceContext = {
      run: jest.fn((_spaceId: string, fn: () => Promise<unknown>) => fn()),
    } as unknown as jest.Mocked<SpaceContext>;
    service = new ResolveInvitationSpaceContextService(
      assertInvitation,
      spaceContext,
    );
  });

  it('resolves the invitation space and runs the callback within that context', async () => {
    const fn = jest.fn().mockResolvedValue('result');

    const result = await service.run(CODE, fn);

    expect(assertInvitation.execute).toHaveBeenCalledWith(CODE);
    expect(spaceContext.run).toHaveBeenCalledWith(SPACE_ID, fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('result');
  });

  it('propagates when the invitation does not exist', async () => {
    assertInvitation.execute.mockRejectedValue(new Error('not found'));
    const fn = jest.fn();

    await expect(service.run(CODE, fn)).rejects.toThrow('not found');
    expect(spaceContext.run).not.toHaveBeenCalled();
    expect(fn).not.toHaveBeenCalled();
  });
});
