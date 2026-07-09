import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { DeletePlantPhotoCommand } from '@contexts/plant-photos/application/commands/delete-plant-photo/delete-plant-photo.command';
import { UploadPlantPhotoCommand } from '@contexts/plant-photos/application/commands/upload-plant-photo/upload-plant-photo.command';
import { PlantPhotoFindByCriteriaQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-criteria/plant-photo-find-by-criteria.query';
import { PlantPhotoFindByIdQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query';
import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoRestMapper } from '../mappers/plant-photo/plant-photo.mapper';
import { PlantPhotosController } from './plant-photos.controller';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const PHOTO_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;

describe('PlantPhotosController', () => {
  let controller: PlantPhotosController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantPhotoRestMapper>;
  const dto = { id: PHOTO_ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = {
      execute: jest.fn().mockResolvedValue({} as PlantPhotoViewModel),
    } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn().mockReturnValue(dto),
    } as unknown as jest.Mocked<PlantPhotoRestMapper>;
    controller = new PlantPhotosController(commandBus, queryBus, mapper);
  });

  describe('uploadPlantPhoto()', () => {
    it('dispatches the upload command and maps the result', async () => {
      commandBus.execute.mockResolvedValue({
        id: PHOTO_ID,
        plantId: PLANT_ID,
        fileId: 'file-1',
        url: '/api/files/file-1/content',
        createdAt: new Date(),
      });

      const file = {
        originalname: 'rose.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('x'),
      } as never;

      const result = await controller.uploadPlantPhoto(
        file,
        { plantId: PLANT_ID } as never,
        user,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UploadPlantPhotoCommand),
      );
      expect(result.id).toBe(PHOTO_ID);
      expect(result.plantId).toBe(PLANT_ID);
    });

    it('throws BadRequestException when no file part is provided', async () => {
      await expect(
        controller.uploadPlantPhoto(
          undefined as never,
          { plantId: PLANT_ID } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('plantPhotosFindByCriteria()', () => {
    it('queries by criteria and maps the paginated result', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as PlantPhotoViewModel], 1, 1, 20),
      );

      const result = await controller.plantPhotosFindByCriteria({} as never);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantPhotoFindByCriteriaQuery),
      );
      expect(result.items).toEqual([dto]);
      expect(result.total).toBe(1);
    });
  });

  describe('plantPhotoFindById()', () => {
    it('queries by id and maps the photo', async () => {
      const result = await controller.plantPhotoFindById(PHOTO_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantPhotoFindByIdQuery),
      );
      expect(result).toBe(dto);
    });
  });

  describe('deletePlantPhoto()', () => {
    it('dispatches the delete command with the requesting user and returns success', async () => {
      const result = await controller.deletePlantPhoto(PHOTO_ID, user);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeletePlantPhotoCommand),
      );
      expect(result).toEqual({ success: true });
    });
  });
});
