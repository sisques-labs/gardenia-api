import { BadRequestException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { CurrentUserPayload } from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { IdentifyPlantCommand } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.command';
import { PlantIdentificationFindByCriteriaQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-criteria/plant-identification-find-by-criteria.query';
import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationRestMapper } from '../mappers/plant-identification/plant-identification.mapper';
import { PlantIdentificationsController } from './plant-identifications.controller';

const IDENTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const user = {
  userId: '660e8400-e29b-41d4-a716-446655440001',
} as CurrentUserPayload;
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

function buildFile(name = 'leaf.png') {
  return {
    originalname: name,
    mimetype: 'image/png',
    size: 1024,
    buffer: Buffer.from('x'),
  } as never;
}

describe('PlantIdentificationsController', () => {
  let controller: PlantIdentificationsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantIdentificationRestMapper>;
  const responseDto = { id: IDENTIFICATION_ID } as never;

  beforeEach(() => {
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = {
      execute: jest.fn().mockResolvedValue({} as PlantIdentificationViewModel),
    } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toIdentifyResponse: jest.fn().mockReturnValue(responseDto),
      toResponse: jest.fn().mockReturnValue(responseDto),
    } as unknown as jest.Mocked<PlantIdentificationRestMapper>;
    controller = new PlantIdentificationsController(
      commandBus,
      queryBus,
      mapper,
    );
  });

  describe('identifyPlant()', () => {
    it('dispatches IdentifyPlantCommand with parsed organs and maps the result', async () => {
      commandBus.execute.mockResolvedValue({
        id: IDENTIFICATION_ID,
        status: PlantIdentificationStatusEnum.RESOLVED,
        resolved: null,
        candidates: [],
        photos: [],
        createdAt: new Date(),
      });

      const result = await controller.identifyPlant(
        [buildFile('leaf.png'), buildFile('flower.png')],
        { organs: '["leaf","flower"]' } as never,
        user,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(IdentifyPlantCommand),
      );
      expect(result).toBe(responseDto);
    });

    it('throws BadRequestException when no photos are provided', async () => {
      await expect(
        controller.identifyPlant([], { organs: '[]' } as never, user, SPACE_ID),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when organs is not valid JSON', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile()],
          { organs: 'not-json' } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when organs length does not match photos length', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile(), buildFile()],
          { organs: '["leaf"]' } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException for an invalid organ value', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile()],
          { organs: '["stem"]' } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when "organs" arrives as an array (repeated multipart field)', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile()],
          { organs: ['["leaf"]', '["leaf"]'] } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when "project" arrives as an array (repeated multipart field)', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile()],
          { organs: '["leaf"]', project: ['all', 'weurope'] } as never,
          user,
          SPACE_ID,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the "x-space-id" header arrives as an array (repeated header)', async () => {
      await expect(
        controller.identifyPlant(
          [buildFile()],
          { organs: '["leaf"]' } as never,
          user,
          [SPACE_ID, SPACE_ID] as never,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });

  describe('plantIdentificationsFindByCriteria()', () => {
    it('queries by criteria and maps the paginated result', async () => {
      queryBus.execute.mockResolvedValue(
        new PaginatedResult([{} as PlantIdentificationViewModel], 1, 1, 20),
      );

      const result = await controller.plantIdentificationsFindByCriteria(
        {} as never,
      );

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantIdentificationFindByCriteriaQuery),
      );
      expect(result.items).toEqual([responseDto]);
      expect(result.total).toBe(1);
    });
  });

  describe('plantIdentificationFindById()', () => {
    it('queries by id and maps the result', async () => {
      const result =
        await controller.plantIdentificationFindById(IDENTIFICATION_ID);

      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(PlantIdentificationFindByIdQuery),
      );
      expect(result).toBe(responseDto);
    });
  });
});
