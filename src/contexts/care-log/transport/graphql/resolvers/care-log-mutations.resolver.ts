import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';
import { DeleteCareLogEntryCommand } from '@contexts/care-log/application/commands/delete-care-log-entry/delete-care-log-entry.command';
import { UpdateCareLogEntryCommand } from '@contexts/care-log/application/commands/update-care-log-entry/update-care-log-entry.command';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { CreateCareLogEntryGraphQLDto } from '../dtos/requests/create-care-log-entry-graphql.dto';
import { UpdateCareLogEntryGraphQLDto } from '../dtos/requests/update-care-log-entry-graphql.dto';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CareLogMutationsResolver {
  private readonly logger = new Logger(CareLogMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Mutation(() => MutationResponseDto)
  async careLogEntryCreate(
    @Args('input') input: CreateCareLogEntryGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating care log entry for plant: ${input.plantId}`);

    const spaceId = this.spaceContext.require();
    const entryId = await this.commandBus.execute<
      CreateCareLogEntryCommand,
      string
    >(
      new CreateCareLogEntryCommand({
        plantId: input.plantId,
        userId: user.userId,
        spaceId,
        activityType: input.activityType,
        performedAt: input.performedAt,
        notes: input.notes,
        quantity: input.quantity,
        unit: input.unit,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care log entry created successfully',
      id: entryId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async careLogEntryUpdate(
    @Args('input') input: UpdateCareLogEntryGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating care log entry: ${input.id}`);

    await this.commandBus.execute(
      new UpdateCareLogEntryCommand({
        id: input.id,
        requestingUserId: user.userId,
        activityType: input.activityType,
        performedAt: input.performedAt,
        notes: input.notes,
        quantity: input.quantity,
        unit: input.unit,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care log entry updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async careLogEntryDelete(
    @Args('id', { type: () => ID }) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting care log entry: ${id}`);

    await this.commandBus.execute(
      new DeleteCareLogEntryCommand({ id, requestingUserId: user.userId }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care log entry deleted successfully',
      id,
    });
  }
}
