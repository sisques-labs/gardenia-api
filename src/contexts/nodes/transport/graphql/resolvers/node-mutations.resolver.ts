import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { SendNodeCommandCommand } from '@contexts/nodes/application/commands/send-node-command/send-node-command.command';

import { NodeSendCommandRequestDto } from '../dtos/requests/node-send-command.request.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class NodeMutationsResolver {
  private readonly logger = new Logger(NodeMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async nodeSendCommand(
    @Args('input') input: NodeSendCommandRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Sending command ${input.commandType} to node ${input.nodeId}`,
    );

    const commandId = await this.commandBus.execute<
      SendNodeCommandCommand,
      string
    >(
      new SendNodeCommandCommand({
        nodeId: input.nodeId,
        commandType: input.commandType,
        payload: input.payload,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Command sent successfully',
      id: commandId,
    });
  }
}
