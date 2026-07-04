import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';

import { PlantingSpotStatusEnum } from '@contexts/planting-spots/domain/enums/planting-spot-status.enum';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot.view-model';
import { CreatePlantingSpotDto } from '../dtos/create-planting-spot.dto';
import { UpdatePlantingSpotDto } from '../dtos/update-planting-spot.dto';
import { PlantingSpotRestMapper } from '../mappers/planting-spot/planting-spot.mapper';
import { PlantingSpotsController } from './planting-spots.controller';

const SPOT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';

const mockUser = {
  userId: USER_ID,
  email: 'test@test.com',
  appRole: AppRoleEnum.USER,
};
const now = new Date('2024-01-01T00:00:00Z');

const mockVm = new PlantingSpotViewModel({
  id: SPOT_ID,
  name: 'North Bed',
  type: PlantingSpotTypeEnum.RAISED_BED,
  description: null,
  capacity: null,
  row: null,
  column: null,
  dimensionsWidth: null,
  dimensionsHeight: null,
  dimensionsLength: null,
  soilType: null,
  status: 'active',
  fallowSince: null,
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: now,
  updatedAt: now,
});

const mockResponseDto = {
  id: SPOT_ID,
  name: 'North Bed',
  type: PlantingSpotTypeEnum.RAISED_BED,
  description: null,
  status: PlantingSpotStatusEnum.ACTIVE,
  fallowSince: null,
  userId: USER_ID,
  spaceId: SPACE_ID,
  createdAt: now,
  updatedAt: now,
};

describe('PlantingSpotsController', () => {
  let controller: PlantingSpotsController;
  let commandBus: jest.Mocked<CommandBus>;
  let queryBus: jest.Mocked<QueryBus>;
  let mapper: jest.Mocked<PlantingSpotRestMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    mapper = {
      toResponse: jest.fn(),
    } as unknown as jest.Mocked<PlantingSpotRestMapper>;

    controller = new PlantingSpotsController(commandBus, queryBus, mapper);
  });

  describe('createPlantingSpot', () => {
    it('dispatches CreatePlantingSpotCommand, fetches the spot and returns mapped response', async () => {
      commandBus.execute.mockResolvedValueOnce(SPOT_ID);
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const dto: CreatePlantingSpotDto = {
        name: 'North Bed',
        type: PlantingSpotTypeEnum.RAISED_BED,
      };

      const result = await controller.createPlantingSpot(
        dto,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('getPlantingSpot', () => {
    it('dispatches PlantingSpotFindByIdQuery and returns mapped response', async () => {
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const result = await controller.plantingSpotFindById(SPOT_ID, SPACE_ID);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('listPlantingSpots', () => {
    it('dispatches PlantingSpotFindByCriteriaQuery and returns paginated result', async () => {
      const paginatedVms = {
        items: [mockVm],
        total: 1,
        page: 1,
        perPage: 20,
        totalPages: 1,
      };
      queryBus.execute.mockResolvedValueOnce(paginatedVms);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const result = await controller.plantingSpotsFindByCriteria();

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('updatePlantingSpot', () => {
    it('dispatches UpdatePlantingSpotCommand, fetches the updated spot and returns mapped response', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const dto: UpdatePlantingSpotDto = { name: 'Updated Bed' };

      const result = await controller.updatePlantingSpot(
        SPOT_ID,
        dto,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('deletePlantingSpot', () => {
    it('dispatches DeletePlantingSpotCommand and returns void', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);

      await controller.deletePlantingSpot(SPOT_ID, mockUser, SPACE_ID);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('waterPlantingSpot', () => {
    it('dispatches WaterPlantingSpotCommand and returns the watering result', async () => {
      const wateringResult = {
        plantingSpotId: SPOT_ID,
        wateredPlantIds: ['plant-1', 'plant-2'],
        failedPlants: [],
      };
      commandBus.execute.mockResolvedValueOnce(wateringResult);

      const result = await controller.waterPlantingSpot(
        SPOT_ID,
        {},
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result).toEqual(wateringResult);
    });
  });

  describe('markPlantingSpotFallow', () => {
    it('dispatches MarkPlantingSpotFallowCommand, fetches the spot and returns mapped response', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const result = await controller.markPlantingSpotFallow(
        SPOT_ID,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('markPlantingSpotActive', () => {
    it('dispatches MarkPlantingSpotActiveCommand, fetches the spot and returns mapped response', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      queryBus.execute.mockResolvedValueOnce(mockVm);
      mapper.toResponse.mockReturnValueOnce(mockResponseDto);

      const result = await controller.markPlantingSpotActive(
        SPOT_ID,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(SPOT_ID);
    });
  });
});
