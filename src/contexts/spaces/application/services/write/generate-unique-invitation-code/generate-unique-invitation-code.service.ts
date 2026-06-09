import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: GenerateUniqueInvitationCodeServiceInput,
  ): Promise<InviteCodeGeneratorServiceOutput> {
    const maxRetries = this.configService.get<number>(
      'SPACE_INVITATION_CODE_COLLISION_MAX_RETRIES',
      5,
    );

    for (let attempt = 0; attempt < maxRetries; attempt++) {
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
