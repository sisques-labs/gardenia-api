import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { CreatedPlantPortResult } from '@contexts/plant-identification/application/ports/created-plant-port.result';
import {
  IPlantsPort,
  PLANTS_PORT,
} from '@contexts/plant-identification/application/ports/plants.port';
import { AssertPlantIdentificationExistsService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-exists/assert-plant-identification-exists.service';
import { AssertPlantIdentificationOwnershipService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-ownership/assert-plant-identification-ownership.service';
import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationNotResolvedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-resolved.exception';
import {
  IPlantIdentificationWriteRepository,
  PLANT_IDENTIFICATION_WRITE_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';

import { CreatePlantFromIdentificationCommand } from './create-plant-from-identification.command';

@CommandHandler(CreatePlantFromIdentificationCommand)
export class CreatePlantFromIdentificationCommandHandler
  extends BaseCommandHandler<
    CreatePlantFromIdentificationCommand,
    PlantIdentificationAggregate
  >
  implements
    ICommandHandler<
      CreatePlantFromIdentificationCommand,
      CreatedPlantPortResult
    >
{
  private readonly logger = new Logger(
    CreatePlantFromIdentificationCommandHandler.name,
  );

  constructor(
    @Inject(PLANT_IDENTIFICATION_WRITE_REPOSITORY)
    private readonly plantIdentificationWriteRepository: IPlantIdentificationWriteRepository,
    @Inject(PLANTS_PORT)
    private readonly plantsPort: IPlantsPort,
    private readonly assertPlantIdentificationExistsService: AssertPlantIdentificationExistsService,
    private readonly assertPlantIdentificationOwnershipService: AssertPlantIdentificationOwnershipService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(
    command: CreatePlantFromIdentificationCommand,
  ): Promise<CreatedPlantPortResult> {
    const identification =
      await this.assertPlantIdentificationExistsService.execute(
        command.identificationId,
      );

    this.assertPlantIdentificationOwnershipService.execute(
      identification,
      command.requestingUserId,
    );

    // Checked BEFORE the cross-context write below (not just left to
    // `convertToPlant()`'s own guard, which only fires afterward) — a
    // double-submit/retry against an already-converted identification must
    // not create a second orphaned Plant before the 409 surfaces.
    if (identification.convertedToPlantId) {
      throw new PlantIdentificationAlreadyConvertedException(
        identification.id.value,
      );
    }

    if (
      !identification.resolvedSpeciesKey ||
      !identification.resolvedScientificName
    ) {
      throw new PlantIdentificationNotResolvedException(
        identification.id.value,
      );
    }

    const createdPlant = await this.plantsPort.createPlant({
      name: command.name.value,
      gbifSpeciesKey: identification.resolvedSpeciesKey.value,
      speciesScientificName: identification.resolvedScientificName.value,
      imageUrl: command.imageUrl?.value ?? null,
      userId: command.requestingUserId.value,
    });

    identification.convertToPlant(createdPlant.id);

    await this.plantIdentificationWriteRepository.save(identification);
    await this.publishEvents(identification);

    this.logger.log(
      `Plant identification ${identification.id.value} converted to plant ${createdPlant.id}`,
    );

    return { id: createdPlant.id };
  }
}
