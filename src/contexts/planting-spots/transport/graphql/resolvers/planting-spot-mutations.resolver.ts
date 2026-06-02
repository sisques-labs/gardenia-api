import { Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { CreatePlantingSpotGraphQLDto } from '../dtos/requests/create-planting-spot-graphql.dto';
import { UpdatePlantingSpotGraphQLDto } from '../dtos/requests/update-planting-spot-graphql.dto';

@Resolver()
export class PlantingSpotMutationsResolver {
  private readonly logger = new Logger(PlantingSpotMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
  ) {}

  @Mutation(() => MutationResponseDto)
  async createPlantingSpot(
    @Args('input') input: CreatePlantingSpotGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
    @Context('req') req: { headers?: { 'x-space-id'?: string } } | string,
  ): Promise<MutationResponseDto> {
    const spaceId =
      typeof req === 'string' ? req : (req?.headers?.['x-space-id'] ?? '');
    this.logger.log(`Creating planting spot for user: ${user.userId}`);

    const spotId = await this.commandBus.execute<
      CreatePlantingSpotCommand,
      string
    >(
      new CreatePlantingSpotCommand({
        name: input.name,
        type: input.type,
        description: input.description ?? undefined,
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
  async updatePlantingSpot(
    @Args('input') input: UpdatePlantingSpotGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
    @Context('req') req: { headers?: { 'x-space-id'?: string } } | string,
  ): Promise<MutationResponseDto> {
    const spaceId =
      typeof req === 'string' ? req : (req?.headers?.['x-space-id'] ?? '');
    this.logger.log(
      `Updating planting spot ${input.id} for user: ${user.userId}`,
    );

    await this.commandBus.execute(
      new UpdatePlantingSpotCommand({
        spotId: input.id,
        name: input.name,
        type: input.type,
        description: input.description,
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
  async deletePlantingSpot(
    @Args('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Context('req') req: { headers?: { 'x-space-id'?: string } } | string,
  ): Promise<MutationResponseDto> {
    const spaceId =
      typeof req === 'string' ? req : (req?.headers?.['x-space-id'] ?? '');
    this.logger.log(`Deleting planting spot ${id} for user: ${user.userId}`);

    await this.commandBus.execute(
      new DeletePlantingSpotCommand({
        spotId: id,
        requestingUserId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Planting spot deleted successfully',
      id,
    });
  }
}
