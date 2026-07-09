import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreateHarvestCommand } from '@contexts/harvests/application/commands/create-harvest/create-harvest.command';
import { DeleteHarvestCommand } from '@contexts/harvests/application/commands/delete-harvest/delete-harvest.command';
import { UpdateHarvestCommand } from '@contexts/harvests/application/commands/update-harvest/update-harvest.command';
import { HarvestCreateRequestDto } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-create.request.dto';
import { HarvestDeleteRequestDto } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-delete.request.dto';
import { HarvestUpdateRequestDto } from '@contexts/harvests/transport/graphql/dtos/requests/harvest/harvest-update.request.dto';
import { SpaceContext } from '@shared/space-context/space-context.service';

@UseGuards(JwtAuthGuard)
@Resolver()
export class HarvestMutationsResolver {
  private readonly logger = new Logger(HarvestMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Mutation(() => MutationResponseDto)
  async harvestCreate(
    @Args('input') input: HarvestCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating harvest for user: ${user.userId}`);

    const spaceId = this.spaceContext.require();
    const harvestId = await this.commandBus.execute<
      CreateHarvestCommand,
      string
    >(
      new CreateHarvestCommand({
        cropType: input.cropType,
        quantity: input.quantity,
        unit: input.unit,
        harvestedAt: input.harvestedAt,
        userId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Harvest recorded successfully',
      id: harvestId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async harvestUpdate(
    @Args('input') input: HarvestUpdateRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating harvest ${input.id}`);

    await this.commandBus.execute(
      new UpdateHarvestCommand({
        id: input.id,
        cropType: input.cropType,
        quantity: input.quantity,
        unit: input.unit,
        harvestedAt: input.harvestedAt,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Harvest updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async harvestDelete(
    @Args('input') input: HarvestDeleteRequestDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting harvest ${input.id}`);

    await this.commandBus.execute(new DeleteHarvestCommand({ id: input.id }));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Harvest deleted successfully',
      id: input.id,
    });
  }
}
