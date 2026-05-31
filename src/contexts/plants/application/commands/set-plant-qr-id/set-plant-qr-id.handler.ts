import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import {
  IPlantWriteRepository,
  PLANT_WRITE_REPOSITORY,
} from '@contexts/plants/domain/repositories/write/plant-write.repository';
import { AssertPlantExistsService } from '../../services/write/assert-plant-exists/assert-plant-exists.service';

import { SetPlantQrIdCommand } from './set-plant-qr-id.command';

@CommandHandler(SetPlantQrIdCommand)
export class SetPlantQrIdCommandHandler implements ICommandHandler<
  SetPlantQrIdCommand,
  void
> {
  private readonly logger = new Logger(SetPlantQrIdCommandHandler.name);

  constructor(
    @Inject(PLANT_WRITE_REPOSITORY)
    private readonly plantWriteRepository: IPlantWriteRepository,
    private readonly assertPlantExistsService: AssertPlantExistsService,
  ) {}

  async execute(command: SetPlantQrIdCommand): Promise<void> {
    const plant = await this.assertPlantExistsService.execute(command.plantId);

    plant.linkQr(command.qrId);
    await this.plantWriteRepository.save(plant);

    this.logger.log(
      `Plant ${command.plantId.value} linked to QR ${command.qrId.value}`,
    );
  }
}
