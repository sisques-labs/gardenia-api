import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import {
  IWaterPlantPort,
  WaterPlantPortInput,
} from '@contexts/planting-spots/application/ports/water-plant.port';
import { WaterPlantCommand } from '@contexts/care-schedule/application/commands/water-plant/water-plant.command';

@Injectable()
export class WaterPlantAdapter implements IWaterPlantPort {
  constructor(private readonly commandBus: CommandBus) {}

  async waterPlant(input: WaterPlantPortInput): Promise<void> {
    await this.commandBus.execute(new WaterPlantCommand(input));
  }
}
