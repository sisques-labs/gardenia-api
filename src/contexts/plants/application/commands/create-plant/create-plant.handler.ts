import { Inject, Logger } from '@nestjs/common';
import {
  CommandBus,
  CommandHandler,
  EventBus,
  ICommandHandler,
} from '@nestjs/cqrs';
import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';
import { PlantQrTargetUrlBuilderService } from '../../services/read/plant-qr-target-url-builder/plant-qr-target-url-builder.service';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { PlantAggregate } from '@contexts/plants/domain/aggregates/plant.aggregate';
import { PlantBuilder } from '@contexts/plants/domain/builders/plant.builder';
import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';

import { SetPlantQrIdCommand } from '../set-plant-qr-id/set-plant-qr-id.command';
import { CreatePlantCommand } from './create-plant.command';

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

    const plant = this.plantBuilder
      .withId(UuidValueObject.generate().value)
      .withName(command.name.value)
      .withSpecies(command.species?.value ?? null)
      .withImageUrl(command.imageUrl?.value ?? null)
      .withUserId(command.userId.value)
      .withSpaceId(this.spaceContext.require())
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    plant.create();

    await this.plantWriteRepository.save(plant);
    await this.publishEvents(plant);

    const spaceId = this.spaceContext.require();
    const targetUrl = this.plantQrTargetUrlBuilder.build(
      plant.id.value,
      spaceId,
    );
    const qrId = await this.commandBus.execute<CreateQrCommand, string>(
      new CreateQrCommand({ targetUrl, spaceId, plantId: plant.id.value }),
    );

    await this.commandBus.execute(
      new SetPlantQrIdCommand({ plantId: plant.id.value, qrId }),
    );

    this.logger.log(
      `Plant created: ${plant.id.value} by user: ${command.userId.value}`,
    );

    return plant.id.value;
  }
}
