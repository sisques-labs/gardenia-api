import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import { PlantQrTargetUrlBuilderService } from '@contexts/plants/application/services/read/plant-qr-target-url-builder/plant-qr-target-url-builder.service';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { Inject, Logger } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

@CommandHandler(CreatePlantCommand)
export class CreatePlantCommandHandler
  extends BaseCommandHandler<CreatePlantCommand, PlantAggregate>
  implements ICommandHandler<CreatePlantCommand, string>
{
  private readonly logger = new Logger(CreatePlantCommandHandler.name);

  constructor(
    @Inject(PLANT_WRITE_REPOSITORY)
    private readonly plantWriteRepository: IPlantWriteRepository,
    private readonly plantBuilder: PlantBuilder,
    private readonly spaceContext: SpaceContext,
    private readonly commandBus: CommandBus,
    private readonly plantQrTargetUrlBuilder: PlantQrTargetUrlBuilderService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreatePlantCommand): Promise<string> {
    const now = new Date();
    const spaceId = this.spaceContext.require();
    const plantId = UuidValueObject.generate().value;

    const targetUrl = await this.plantQrTargetUrlBuilder.execute({
      plantId,
      spaceId,
    });
    const qrId = await this.commandBus.execute<CreateQrCommand, string>(
      new CreateQrCommand({ targetUrl, spaceId }),
    );

    const plant = this.plantBuilder
      .withId(plantId)
      .withName(command.name.value)
      .withSpecies(command.species?.value ?? null)
      .withImageUrl(command.imageUrl?.value ?? null)
      .withUserId(command.userId.value)
      .withSpaceId(spaceId)
      .withQrId(qrId)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    plant.create();

    await this.plantWriteRepository.save(plant);
    await this.publishEvents(plant);

    this.logger.log(
      `Plant created: ${plant.id.value} by user: ${command.userId.value}`,
    );

    return plant.id.value;
  }
}
