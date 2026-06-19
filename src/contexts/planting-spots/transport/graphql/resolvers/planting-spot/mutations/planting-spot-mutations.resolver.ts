import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { PlantingSpotCreateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-create.request.dto';
import { PlantingSpotDeleteRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-delete.request.dto';
import { PlantingSpotUpdateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-update.request.dto';
import { Logger, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { SpaceContext } from '@shared/space-context/space-context.service';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

@UseGuards(JwtAuthGuard)
@Resolver()
export class PlantingSpotMutationsResolver {
  private readonly logger = new Logger(PlantingSpotMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Mutation(() => MutationResponseDto)
  async plantingSpotCreate(
    @Args('input') input: PlantingSpotCreateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating planting spot for user: ${user.userId}`);

    const spaceId = this.spaceContext.require();
    const spotId = await this.commandBus.execute<
      CreatePlantingSpotCommand,
      string
    >(
      new CreatePlantingSpotCommand({
        name: input.name,
        type: input.type,
        description: input.description ?? undefined,
        capacity: input.capacity ?? undefined,
        row: input.row ?? undefined,
        column: input.column ?? undefined,
        dimensions: input.dimensions ?? undefined,
        soilType: input.soilType ?? undefined,
        userId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Planting spot created successfully',
      id: spotId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async plantingSpotUpdate(
    @Args('input') input: PlantingSpotUpdateRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Updating planting spot ${input.id} for user: ${user.userId}`,
    );

    const spaceId = this.spaceContext.require();
    await this.commandBus.execute(
      new UpdatePlantingSpotCommand({
        id: input.id,
        name: input.name,
        type: input.type,
        description: input.description,
        capacity: input.capacity,
        row: input.row,
        column: input.column,
        dimensions: input.dimensions,
        soilType: input.soilType,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Planting spot updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async plantingSpotDelete(
    @Args('input') input: PlantingSpotDeleteRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(
      `Deleting planting spot ${input.id} for user: ${user.userId}`,
    );

    const spaceId = this.spaceContext.require();
    await this.commandBus.execute(
      new DeletePlantingSpotCommand({
        id: input.id,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Planting spot deleted successfully',
      id: input.id,
    });
  }
}
