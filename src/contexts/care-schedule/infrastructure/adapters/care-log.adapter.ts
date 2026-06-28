import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { ICareLogPort } from '@contexts/care-schedule/application/ports/care-log.port';
import { RecordCareLogEntryInput } from '@contexts/care-schedule/application/ports/record-care-log-entry.input';
import { CreateCareLogEntryCommand } from '@contexts/care-log/application/commands/create-care-log-entry/create-care-log-entry.command';

@Injectable()
export class CareLogAdapter implements ICareLogPort {
  private readonly logger = new Logger(CareLogAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async recordCareLogEntry(input: RecordCareLogEntryInput): Promise<void> {
    this.logger.log(
      `Recording care-log entry for plant ${input.plantId} (${input.activityType})`,
    );

    await this.commandBus.execute(
      new CreateCareLogEntryCommand({
        plantId: input.plantId,
        userId: input.userId,
        spaceId: input.spaceId,
        activityType: input.activityType,
        performedAt: input.performedAt,
        quantity: input.quantity,
        unit: input.unit,
        notes: input.notes,
      }),
    );
  }
}
