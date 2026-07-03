import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '@contexts/auth/infrastructure/guards/jwt-auth.guard';
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { WaterPlantingSpotCommand } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.command';
import { WaterPlantingSpotResult } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.result';
import { PlantingSpotCreateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-create.request.dto';
import { PlantingSpotDeleteRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-delete.request.dto';
import { PlantingSpotUpdateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-update.request.dto';
import { PlantingSpotWaterRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-water.request.dto';
import { PlantingSpotWaterResultObject } from '@contexts/planting-spots/transport/graphql/objects/planting-spot-water-result.object';
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
        description: input.description ?? null,
        capacity: input.capacity ?? null,
        row: input.row ?? null,
        column: input.column ?? null,
        dimensionsWidth: input.dimensions?.width ?? null,
        dimensionsHeight: input.dimensions?.height ?? null,
        dimensionsLength: input.dimensions?.length ?? null,
        soilType: input.soilType ?? null,
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
        dimensionsWidth:
          input.dimensions !== undefined
            ? (input.dimensions?.width ?? null)
            : undefined,
        dimensionsHeight:
          input.dimensions !== undefined
            ? (input.dimensions?.height ?? null)
            : undefined,
        dimensionsLength:
          input.dimensions !== undefined
            ? (input.dimensions?.length ?? null)
            : undefined,
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

  @Mutation(() => PlantingSpotWaterResultObject)
  async plantingSpotWater(
    @Args('input') input: PlantingSpotWaterRequestDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<PlantingSpotWaterResultObject> {
    this.logger.log(
      `Watering planting spot ${input.id} for user: ${user.userId}`,
    );

    const spaceId = this.spaceContext.require();
    const result = await this.commandBus.execute<
      WaterPlantingSpotCommand,
      WaterPlantingSpotResult
    >(
      new WaterPlantingSpotCommand({
        id: input.id,
        userId: user.userId,
        spaceId,
        performedAt: input.performedAt,
      }),
    );

    return result;
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
