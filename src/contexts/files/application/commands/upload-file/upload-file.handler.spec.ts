import { EventBus } from '@nestjs/cqrs';

import { IFileStoragePort } from '@contexts/files/application/ports/file-storage.port';
import { FileBuilder } from '@contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { IFileWriteRepository } from '@contexts/files/domain/repositories/write/file-write.repository';
import { UploadFileCommand } from './upload-file.command';
import { UploadFileCommandHandler } from './upload-file.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

describe('UploadFileCommandHandler', () => {
  let handler: UploadFileCommandHandler;
  let mockWriteRepo: jest.Mocked<IFileWriteRepository>;
  let mockStoragePort: jest.Mocked<IFileStoragePort>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IFileWriteRepository>;

    mockStoragePort = {
      save: jest.fn().mockResolvedValue(undefined),
      read: jest.fn(),
      delete: jest.fn(),
      resolveUrl: jest
        .fn()
        .mockImplementation((key: string) => `/api/files/${key}/content`),
    };

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new UploadFileCommandHandler(
      mockWriteRepo,
      mockStoragePort,
      new FileBuilder(),
      mockEventBus,
    );
  });

  function buildCommand(): UploadFileCommand {
    return new UploadFileCommand({
      filename: 'rose.png',
      mimeType: FileMimeTypeEnum.IMAGE_PNG,
      size: 1024,
      content: Buffer.from('binary-content'),
      userId: USER_ID,
      spaceId: SPACE_ID,
    });
  }

  it('persists metadata, stores bytes via the port, and returns id + url', async () => {
    const result = await handler.execute(buildCommand());

    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(mockStoragePort.save).toHaveBeenCalledTimes(1);
    expect(mockStoragePort.resolveUrl).toHaveBeenCalledWith(result.id);
    expect(result.id).toHaveLength(36);
    expect(result.url).toBe(`/api/files/${result.id}/content`);
  });

  it('passes the raw bytes and tenant scope to the storage port', async () => {
    await handler.execute(buildCommand());

    const saveArg = mockStoragePort.save.mock.calls[0][0];
    expect(saveArg.bytes.toString()).toBe('binary-content');
    expect(saveArg.mimeType).toBe('image/png');
    expect(saveArg.spaceId).toBe(SPACE_ID);
  });

  it('rejects a non-image mime type at command construction', () => {
    expect(
      () =>
        new UploadFileCommand({
          filename: 'doc.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          content: Buffer.from('x'),
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
    ).toThrow();
  });

  it('rejects a non-positive size at command construction', () => {
    expect(
      () =>
        new UploadFileCommand({
          filename: 'rose.png',
          mimeType: FileMimeTypeEnum.IMAGE_PNG,
          size: 0,
          content: Buffer.from('x'),
          userId: USER_ID,
          spaceId: SPACE_ID,
        }),
    ).toThrow();
  });
});
