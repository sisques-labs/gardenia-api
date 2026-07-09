import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrRegenerateRequestDto } from '@contexts/qr/transport/graphql/dtos/requests/qr/qr-regenerate.request.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class QrMutationsResolver {
  private readonly logger = new Logger(QrMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async qrRegenerate(
    @Args('input') input: QrRegenerateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Regenerating QR: ${input.id}`);

    await this.commandBus.execute(new RegenerateQrCommand({ qrId: input.id }));

    return this.mutationResponseMapper.toResponseDto({
      success: true,
      message: 'QR regenerated',
      id: input.id,
    });
  }
}
