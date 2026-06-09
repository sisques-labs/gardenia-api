import { ConfigService } from '@nestjs/config';

import { InvitationCodeGenerationFailedException } from '@contexts/spaces/domain/exceptions/invitation-code-generation-failed.exception';
import { ISpaceInvitationWriteRepository } from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';

import { InviteCodeGeneratorService } from '../invite-code-generator/invite-code-generator.service';
import { GenerateUniqueInvitationCodeService } from './generate-unique-invitation-code.service';

describe('GenerateUniqueInvitationCodeService', () => {
  let service: GenerateUniqueInvitationCodeService;
  let inviteCodeGeneratorService: jest.Mocked<InviteCodeGeneratorService>;
  let writeRepository: jest.Mocked<ISpaceInvitationWriteRepository>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    inviteCodeGeneratorService = {
      execute: jest.fn().mockResolvedValue({
        code: 'LIM2026AB',
        displayCode: 'LIM · 2026 · AB',
      }),
    } as unknown as jest.Mocked<InviteCodeGeneratorService>;

    writeRepository = {
      findByCode: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<ISpaceInvitationWriteRepository>;

    configService = {
      getOrThrow: jest.fn().mockReturnValue(5),
    } as unknown as jest.Mocked<ConfigService>;

    service = new GenerateUniqueInvitationCodeService(
      inviteCodeGeneratorService,
      writeRepository,
      configService,
    );
  });

  it('returns a unique code when no collision exists', async () => {
    const result = await service.execute({ spaceName: 'Liminal' });

    expect(result.code).toBe('LIM2026AB');
    expect(inviteCodeGeneratorService.execute).toHaveBeenCalledTimes(1);
  });

  it('retries when a generated code already exists', async () => {
    writeRepository.findByCode
      .mockResolvedValueOnce({} as never)
      .mockResolvedValueOnce(null);

    await service.execute({ spaceName: 'Liminal' });

    expect(inviteCodeGeneratorService.execute).toHaveBeenCalledTimes(2);
  });

  it('throws InvitationCodeGenerationFailedException after max retries', async () => {
    writeRepository.findByCode.mockResolvedValue({} as never);

    await expect(service.execute({ spaceName: 'Liminal' })).rejects.toThrow(
      InvitationCodeGenerationFailedException,
    );
  });
});
