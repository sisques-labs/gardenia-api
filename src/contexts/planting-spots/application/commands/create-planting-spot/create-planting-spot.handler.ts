import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantingSpotAggregate } from '@contexts/planting-spots/domain/aggregates/planting-spot.aggregate';
import { PlantingSpotBuilder } from '@contexts/planting-spots/domain/builders/planting-spot.builder';
import {
  IPlantingSpotWriteRepository,
  PLANTING_SPOT_WRITE_REPOSITORY,
} from '@contexts/planting-spots/domain/repositories/write/planting-spot-write.repository';

import { CreatePlantingSpotCommand } from './create-planting-spot.command';

@CommandHandler(CreatePlantingSpotCommand)
export class CreatePlantingSpotCommandHandler
  extends BaseCommandHandler<CreatePlantingSpotCommand, PlantingSpotAggregate>
  implements ICommandHandler<CreatePlantingSpotCommand, string>
{
  private readonly logger = new Logger(CreatePlantingSpotCommandHandler.name);

  constructor(
    @Inject(PLANTING_SPOT_WRITE_REPOSITORY)
    private readonly plantingSpotWriteRepository: IPlantingSpotWriteRepository,
    private readonly plantingSpotBuilder: PlantingSpotBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreatePlantingSpotCommand): Promise<string> {
    const now = new Date();
    const spotId = UuidValueObject.generate().value;

    const spot = this.plantingSpotBuilder
      .withId(spotId)
      .withName(command.name.value)
      .withType(command.type.value)
      .withDescription(command.description?.value ?? null)
      .withCapacity(command.capacity?.value ?? null)
      .withRow(command.row?.value ?? null)
      .withColumn(command.column?.value ?? null)
      .withDimensionsWidth(command.dimensions?.width ?? null)
      .withDimensionsHeight(command.dimensions?.height ?? null)
      .withDimensionsLength(command.dimensions?.length ?? null)
      .withSoilType(command.soilType?.value ?? null)
      .withStatus(command.status.value)
      .withFallowSince(command.fallowSince)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    spot.create();

    await this.plantingSpotWriteRepository.save(spot);
    await this.publishEvents(spot);

    this.logger.log(
      `PlantingSpot created: ${spot.id.value} by user: ${command.userId.value}`,
    );

    return spot.id.value;
  }
}
