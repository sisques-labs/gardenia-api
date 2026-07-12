import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { ClaimBridgeCommand } from '@contexts/nodes/application/commands/claim-bridge/claim-bridge.command';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { BridgeClaimRequestDto } from '../dtos/requests/bridge-claim.request.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class BridgeMutationsResolver {
  private readonly logger = new Logger(BridgeMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly spaceContext: SpaceContext,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async bridgeClaim(
    @Args('input') input: BridgeClaimRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Claiming bridge ${input.bridgeId}`);

    await this.commandBus.execute(
      new ClaimBridgeCommand({
        bridgeId: input.bridgeId,
        pairingCode: input.pairingCode,
        spaceId: this.spaceContext.require(),
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Bridge claimed successfully',
      id: input.bridgeId,
    });
  }
}
