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
import { CompleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/complete-care-schedule/complete-care-schedule.command';
import { CreateCareScheduleCommand } from '@contexts/care-schedule/application/commands/create-care-schedule/create-care-schedule.command';
import { DeleteCareScheduleCommand } from '@contexts/care-schedule/application/commands/delete-care-schedule/delete-care-schedule.command';
import { UpdateCareScheduleCommand } from '@contexts/care-schedule/application/commands/update-care-schedule/update-care-schedule.command';
import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';
import { WaterPlantResult } from '@contexts/care-schedule/application/commands/water-plant/water-plant.result';
import { CompleteCareScheduleGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/complete-care-schedule-graphql.dto';
import { CreateCareScheduleGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/create-care-schedule-graphql.dto';
import { UpdateCareScheduleGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/update-care-schedule-graphql.dto';
import { WaterPlantGraphQLDto } from '@contexts/care-schedule/transport/graphql/dtos/requests/water-plant-graphql.dto';
import { WaterPlantResultObject } from '@contexts/care-schedule/transport/graphql/objects/water-plant-result.object';
import { SpaceContext } from '@shared/space-context/space-context.service';

@UseGuards(JwtAuthGuard)
@Resolver()
export class CareScheduleMutationsResolver {
  private readonly logger = new Logger(CareScheduleMutationsResolver.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly mutationResponseGraphQLMapper: MutationResponseGraphQLMapper,
    private readonly spaceContext: SpaceContext,
  ) {}

  @Mutation(() => MutationResponseDto)
  async careScheduleCreate(
    @Args('input') input: CreateCareScheduleGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Creating care schedule for user: ${user.userId}`);

    const spaceId = this.spaceContext.require();
    const careScheduleId = await this.commandBus.execute<
      CreateCareScheduleCommand,
      string
    >(
      new CreateCareScheduleCommand({
        plantId: input.plantId,
        activityType: input.activityType,
        intervalDays: input.intervalDays,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
        nextDueAt: input.nextDueAt,
        active: input.active,
        userId: user.userId,
        spaceId,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care schedule created successfully',
      id: careScheduleId,
    });
  }

  @Mutation(() => MutationResponseDto)
  async careScheduleUpdate(
    @Args('input') input: UpdateCareScheduleGraphQLDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Updating care schedule ${input.id}`);

    await this.commandBus.execute(
      new UpdateCareScheduleCommand({
        id: input.id,
        activityType: input.activityType,
        intervalDays: input.intervalDays,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
        active: input.active,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care schedule updated successfully',
      id: input.id,
    });
  }

  @Mutation(() => MutationResponseDto)
  async careScheduleComplete(
    @Args('input') input: CompleteCareScheduleGraphQLDto,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Completing care schedule ${input.id}`);

    await this.commandBus.execute(
      new CompleteCareScheduleCommand({
        id: input.id,
        completedAt: input.completedAt,
      }),
    );

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care schedule completed successfully',
      id: input.id,
    });
  }

  @Mutation(() => WaterPlantResultObject)
  async careScheduleWaterPlant(
    @Args('input') input: WaterPlantGraphQLDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<WaterPlantResultObject> {
    this.logger.log(`Watering plant ${input.plantId}`);

    const spaceId = this.spaceContext.require();
    const result = await this.commandBus.execute<
      WaterPlantCommand,
      WaterPlantResult
    >(
      new WaterPlantCommand({
        plantId: input.plantId,
        userId: user.userId,
        spaceId,
        performedAt: input.performedAt,
      }),
    );

    return result;
  }

  @Mutation(() => MutationResponseDto)
  async careScheduleDelete(
    @Args('id') id: string,
  ): Promise<MutationResponseDto> {
    this.logger.log(`Deleting care schedule ${id}`);

    await this.commandBus.execute(new DeleteCareScheduleCommand({ id }));

    return this.mutationResponseGraphQLMapper.toResponseDto({
      success: true,
      message: 'Care schedule deleted successfully',
      id,
    });
  }
}
