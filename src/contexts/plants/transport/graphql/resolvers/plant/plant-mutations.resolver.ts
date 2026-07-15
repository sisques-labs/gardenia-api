import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit/graphql';

import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { DeletePlantCommand } from '@contexts/plants/application/commands/delete-plant/delete-plant.command';
import { UpdatePlantCommand } from '@contexts/plants/application/commands/update-plant/update-plant.command';
import { PlantCreateRequestDto } from '../../dtos/requests/plant/plant-create.request.dto';
import { PlantUpdateRequestDto } from '../../dtos/requests/plant/plant-update.request.dto';
import { PlantDeleteRequestDto } from '../../dtos/requests/plant/plant-delete.request.dto';

@Resolver()
@UseGuards(JwtAuthGuard)
export class PlantMutationsResolver {
  private readonly logger = new Logger(PlantMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async plantCreate(
    @Args('input') input: PlantCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating plant for user: ${user.userId}`);

    const plantId = await this.commandBus.execute<CreatePlantCommand, string>(
      new CreatePlantCommand({
        name: input.name,
        gbifSpeciesKey: input.gbifSpeciesKey,
        speciesScientificName: input.speciesScientificName,
        imageUrl: input.imageUrl ?? undefined,
        userId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant created successfully',
      id: plantId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async plantUpdate(
    @Args('input') input: PlantUpdateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating plant ${input.id} for user: ${user.userId}`);

    await this.commandBus.execute(
      new UpdatePlantCommand({
        plantId: input.id,
        name: input.name,
        gbifSpeciesKey: input.gbifSpeciesKey,
        speciesScientificName: input.speciesScientificName,
        imageUrl: input.imageUrl ?? undefined,
        plantingSpotId: input.plantingSpotId,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async plantDelete(
    @Args('input') input: PlantDeleteRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting plant ${input.id} for user: ${user.userId}`);

    await this.commandBus.execute(
      new DeletePlantCommand({
        plantId: input.id,
        requestingUserId: user.userId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Plant deleted successfully',
      id: input.id,
    });
  }
}
