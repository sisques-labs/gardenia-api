import { Inject, Injectable } from '@nestjs/common';
import { IBaseService } from '@sisques-labs/nestjs-kit';

import { InvitationCodeGenerationFailedException } from '@contexts/spaces/domain/exceptions/invitation-code-generation-failed.exception';
import {
  ISpaceInvitationWriteRepository,
  SPACE_INVITATION_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';

import {
  InviteCodeGeneratorService,
  InviteCodeGeneratorServiceOutput,
} from '../invite-code-generator/invite-code-generator.service';

const MAX_CODE_COLLISION_RETRIES = 5;

export interface GenerateUniqueInvitationCodeServiceInput {
  spaceName: string;
}

@Injectable()
export class GenerateUniqueInvitationCodeService implements IBaseService<
  GenerateUniqueInvitationCodeServiceInput,
  InviteCodeGeneratorServiceOutput
> {
  constructor(
    private readonly inviteCodeGeneratorService: InviteCodeGeneratorService,
    @Inject(SPACE_INVITATION_WRITE_REPOSITORY)
    private readonly spaceInvitationWriteRepository: ISpaceInvitationWriteRepository,
  ) {}

  async execute(
    input: GenerateUniqueInvitationCodeServiceInput,
  ): Promise<InviteCodeGeneratorServiceOutput> {
    for (let attempt = 0; attempt < MAX_CODE_COLLISION_RETRIES; attempt++) {
      const generated = await this.inviteCodeGeneratorService.execute({
        spaceName: input.spaceName,
      });
      const existing = await this.spaceInvitationWriteRepository.findByCode(
        generated.code,
      );

      if (!existing) {
        return generated;
      }
    }

    throw new InvitationCodeGenerationFailedException();
  }
}
