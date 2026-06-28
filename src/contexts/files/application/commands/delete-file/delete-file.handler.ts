import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

import { AssertFileExistsService } from '@contexts/files/application/services/write/assert-file-exists/assert-file-exists.service';
import {
  FILE_STORAGE_PORT,
  IFileStoragePort,
} from '@contexts/files/application/ports/file-storage.port';
import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import {
  FILE_WRITE_REPOSITORY,
  IFileWriteRepository,
} from '@contexts/files/domain/repositories/write/file-write.repository';

import { DeleteFileCommand } from './delete-file.command';

@CommandHandler(DeleteFileCommand)
export class DeleteFileCommandHandler
  extends BaseCommandHandler<DeleteFileCommand, FileAggregate>
  implements ICommandHandler<DeleteFileCommand, void>
{
  private readonly logger = new Logger(DeleteFileCommandHandler.name);

  constructor(
    @Inject(FILE_WRITE_REPOSITORY)
    private readonly fileWriteRepository: IFileWriteRepository,
    @Inject(FILE_STORAGE_PORT)
    private readonly fileStoragePort: IFileStoragePort,
    private readonly assertFileExistsService: AssertFileExistsService,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: DeleteFileCommand): Promise<void> {
    const file = await this.assertFileExistsService.execute(command.id);

    file.delete();

    await this.fileStoragePort.delete(file.storageKey.value);
    await this.fileWriteRepository.delete(file.id.value);
    await this.publishEvents(file);

    this.logger.log(`File deleted: ${command.id.value}`);
  }
}
