import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import {
  FILE_STORAGE_PORT,
  IFileStoragePort,
} from '@contexts/files/application/ports/file-storage.port';
import { FileAggregate } from '@contexts/files/domain/aggregates/file.aggregate';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import {
  FILE_WRITE_REPOSITORY,
  IFileWriteRepository,
} from '@contexts/files/domain/repositories/write/file-write.repository';

import { UploadFileCommand } from './upload-file.command';
import { UploadFileResult } from './upload-file.result';

@CommandHandler(UploadFileCommand)
export class UploadFileCommandHandler
  extends BaseCommandHandler<UploadFileCommand, FileAggregate>
  implements ICommandHandler<UploadFileCommand, UploadFileResult>
{
  private readonly logger = new Logger(UploadFileCommandHandler.name);

  constructor(
    @Inject(FILE_WRITE_REPOSITORY)
    private readonly fileWriteRepository: IFileWriteRepository,
    @Inject(FILE_STORAGE_PORT)
    private readonly fileStoragePort: IFileStoragePort,
    private readonly fileBuilder: FileBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: UploadFileCommand): Promise<UploadFileResult> {
    const now = new Date();
    const fileId = UuidValueObject.generate().value;
    // The storage key is the file id for the database adapter; an object-storage
    // adapter is free to derive its own scheme. The URL is resolved by the port.
    const storageKey = fileId;
    const url = this.fileStoragePort.resolveUrl(storageKey);

    const file = this.fileBuilder
      .withId(fileId)
      .withFilename(command.filename.value)
      .withMimeType(command.mimeType.value)
      .withSize(command.size.value)
      .withStorageKey(storageKey)
      .withUrl(url)
      .withUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    file.create();

    // Metadata first: file_contents has an FK to files(id), so the parent row
    // must exist before the bytes are written.
    await this.fileWriteRepository.save(file);
    await this.fileStoragePort.save({
      key: storageKey,
      bytes: command.content,
      mimeType: command.mimeType.value,
      spaceId: command.spaceId.value,
    });
    await this.publishEvents(file);

    this.logger.log(
      `File uploaded: ${fileId} (${command.mimeType.value}, ${command.size.value} bytes) by user: ${command.userId.value}`,
    );

    return { id: fileId, url };
  }
}
