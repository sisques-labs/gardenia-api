import { CreatePlantCommand } from '@contexts/plants/application/commands/create-plant/create-plant.command';
import {
  IPlantQrPort,
  PLANT_QR_PORT,
} from '@contexts/plants/application/ports/plant-qr.port';
import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plants/application/ports/plant-species.port';
import { PlantQrTargetUrlBuilderService } from '@contexts/plants/application/services/read/plant-qr-target-url-builder/plant-qr-target-url-builder.service';
import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
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
    @Inject(PLANT_QR_PORT)
    private readonly plantQrPort: IPlantQrPort,
    private readonly plantQrTargetUrlBuilder: PlantQrTargetUrlBuilderService,
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreatePlantCommand): Promise<string> {
    let plantSpeciesId: string | null = null;
    if (command.gbifSpeciesKey && command.speciesScientificName) {
      const linked = await this.plantSpeciesPort.findOrCreateByGbifKey(
        command.gbifSpeciesKey.value,
        command.speciesScientificName.value,
      );
      plantSpeciesId = linked.id;
    }

    const now = new Date();
    const spaceId = this.spaceContext.require();
    const plantId = UuidValueObject.generate().value;

    const targetUrl = await this.plantQrTargetUrlBuilder.execute({
      plantId,
      spaceId,
    });
    const qrId = await this.plantQrPort.createForPlant({ targetUrl, spaceId });

    const plant = this.plantBuilder
      .withId(plantId)
      .withName(command.name.value)
      .withPlantSpeciesId(plantSpeciesId)
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
