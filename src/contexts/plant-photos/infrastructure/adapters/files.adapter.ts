import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

import { UploadFilePortInput } from '@contexts/plant-photos/application/ports/upload-file-port.input';
import { UploadedFilePortResult } from '@contexts/plant-photos/application/ports/uploaded-file-port.result';
import { IFilesPort } from '@contexts/plant-photos/application/ports/files.port';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { UploadFileCommand } from '@contexts/files/application/commands/upload-file/upload-file.command';
import { UploadFileResult } from '@contexts/files/application/commands/upload-file/upload-file.result';

@Injectable()
export class FilesAdapter implements IFilesPort {
  private readonly logger = new Logger(FilesAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async uploadFile(
    input: UploadFilePortInput,
  ): Promise<UploadedFilePortResult> {
    this.logger.log(`Uploading file '${input.filename}' via files context`);

    return this.commandBus.execute<UploadFileCommand, UploadFileResult>(
      new UploadFileCommand({
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        content: input.content,
        userId: input.userId,
        spaceId: input.spaceId,
      }),
    );
  }

  async deleteFile(fileId: string): Promise<void> {
    this.logger.log(`Deleting file ${fileId} via files context`);

    await this.commandBus.execute(new DeleteFileCommand({ id: fileId }));
  }
}
