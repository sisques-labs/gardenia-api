import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { UploadFileCommand } from '@contexts/files/application/commands/upload-file/upload-file.command';
import { DeleteFileCommand } from '@contexts/files/application/commands/delete-file/delete-file.command';
import { FileFindByCriteriaQuery } from '@contexts/files/application/queries/file-find-by-criteria/file-find-by-criteria.query';
import { FileFindByIdQuery } from '@contexts/files/application/queries/file-find-by-id/file-find-by-id.query';
import { FileFindContentByIdQuery } from '@contexts/files/application/queries/file-find-content-by-id/file-find-content-by-id.query';
import { FileMimeTypeEnum } from '@contexts/files/domain/enums/file-mime-type.enum';
import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileRestResponseDto } from '../dtos/file-rest-response.dto';
import { FileRestMapper } from '../mappers/file/file.mapper';
import { FilesController } from './files.controller';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const currentUser: CurrentUserPayload = {
  userId: USER_ID,
  email: 'user@example.com',
  appRole: AppRoleEnum.USER,
};

const mockVm = new FileViewModel({
  id: FILE_ID,
  filename: 'rose.png',
  mimeType: 'image/png',
  size: 204800,
  storageKey: FILE_ID,
  url: '/api/files/550e8400/content',
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: NOW,
  updatedAt: NOW,
});

const mockResponseDto: FileRestResponseDto = {
  id: FILE_ID,
  filename: 'rose.png',
  mimeType: 'image/png',
  size: 204800,
  url: '/api/files/550e8400/content',
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: NOW,
  updatedAt: NOW,
};

describe('FilesController', () => {
  let controller: FilesController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<FileRestMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(mockResponseDto),
    } as unknown as jest.Mocked<FileRestMapper>;

    controller = new FilesController(commandBus, queryBus, mapper);
  });

  describe('uploadFile()', () => {
    it('dispatches UploadFileCommand and returns id + url', async () => {
      commandBus.execute.mockResolvedValue({
        id: FILE_ID,
        url: '/api/files/550e8400/content',
      });

      const file = {
        fieldname: 'file',
        originalname: 'rose.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('data'),
      };

      const result = await controller.uploadFile(file, currentUser, SPACE_ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UploadFileCommand),
      );
      expect(result).toEqual({
        id: FILE_ID,
        url: '/api/files/550e8400/content',
      });
    });
  });

  describe('filesFindByCriteria()', () => {
    it('dispatches with no filters when query is empty', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult<FileViewModel>([mockVm], 1, 1, 20),
      );

      const result = await controller.filesFindByCriteria({} as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(FileFindByCriteriaQuery),
      );
      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.filters).toEqual([]);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('applies mimeType and filename filters and explicit pagination', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult<FileViewModel>([], 0, 2, 10),
      );

      await controller.filesFindByCriteria({
        mimeType: FileMimeTypeEnum.IMAGE_PNG,
        filename: 'rose',
        page: 2,
        limit: 10,
      } as never);

      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.filters).toHaveLength(2);
      expect(query.criteria.pagination).toEqual({ page: 2, perPage: 10 });
    });

    it('defaults page to 1 when only limit is provided', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult<FileViewModel>([], 0, 1, 5),
      );

      await controller.filesFindByCriteria({ limit: 5 } as never);

      const query = queryBus.execute.mock
        .calls[0][0] as FileFindByCriteriaQuery;
      expect(query.criteria.pagination).toEqual({ page: 1, perPage: 5 });
    });
  });

  describe('fileFindById()', () => {
    it('dispatches FileFindByIdQuery and returns the mapped response', async () => {
      queryBus.execute.mockResolvedValue(mockVm);

      const result = await controller.fileFindById(FILE_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(FileFindByIdQuery),
      );
      expect(mapper.toResponse).toHaveBeenCalledWith(mockVm);
      expect(result).toBe(mockResponseDto);
    });
  });

  describe('fileContent()', () => {
    it('streams the raw bytes with the expected headers', async () => {
      const bytes = Buffer.from('binary-data');
      queryBus.execute.mockResolvedValue({
        bytes,
        mimeType: 'image/png',
        filename: 'rose.png',
      });
      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.fileContent(FILE_ID, res);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(FileFindContentByIdQuery),
      );
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="rose.png"',
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Length',
        bytes.length,
      );
      expect(res.send).toHaveBeenCalledWith(bytes);
    });
  });

  describe('deleteFile()', () => {
    it('dispatches DeleteFileCommand and returns success', async () => {
      commandBus.execute.mockResolvedValue(undefined);

      const result = await controller.deleteFile(FILE_ID);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeleteFileCommand),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
