import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { CreatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/create-planting-spot/create-planting-spot.command';
import { DeletePlantingSpotCommand } from '@contexts/planting-spots/application/commands/delete-planting-spot/delete-planting-spot.command';
import { UpdatePlantingSpotCommand } from '@contexts/planting-spots/application/commands/update-planting-spot/update-planting-spot.command';
import { WaterPlantingSpotCommand } from '@contexts/planting-spots/application/commands/water-planting-spot/water-planting-spot.command';
import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { PlantingSpotCreateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-create.request.dto';
import { PlantingSpotDeleteRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-delete.request.dto';
import { PlantingSpotUpdateRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-update.request.dto';
import { PlantingSpotWaterRequestDto } from '@contexts/planting-spots/transport/graphql/dtos/requests/planting-spot/planting-spot-water.request.dto';
import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { PlantingSpotMutationsResolver } from './planting-spot-mutations.resolver';

const SPOT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';

const mockUser = {
  userId: USER_ID,
  email: 'test@test.com',
  appRole: AppRoleEnum.USER,
};

describe('PlantingSpotMutationsResolver', () => {
  let sut: PlantingSpotMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;
    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    } as unknown as jest.Mocked<SpaceContext>;

    sut = new PlantingSpotMutationsResolver(
      commandBus,
      mutationResponseGraphQLMapper,
      spaceContext,
    );
  });

  describe('plantingSpotCreate()', () => {
    it('should execute CreatePlantingSpotCommand with space from context', async () => {
      commandBus.execute.mockResolvedValue(SPOT_ID);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue({
        success: true,
        message: 'Planting spot created successfully',
        id: SPOT_ID,
      });

      const input: PlantingSpotCreateRequestDto = {
        name: 'North Bed',
        type: PlantingSpotTypeEnum.RAISED_BED,
      };

      await sut.plantingSpotCreate(input, mockUser);

      expect(spaceContext.require).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(CreatePlantingSpotCommand),
      );
    });
  });

  describe('plantingSpotUpdate()', () => {
    it('should execute UpdatePlantingSpotCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue({
        success: true,
        message: 'Planting spot updated successfully',
        id: SPOT_ID,
      } as MutationResponseDto);

      const input: PlantingSpotUpdateRequestDto = {
        id: SPOT_ID,
        name: 'Updated Bed',
      };

      const result = await sut.plantingSpotUpdate(input, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(UpdatePlantingSpotCommand),
      );
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('plantingSpotWater()', () => {
    it('should execute WaterPlantingSpotCommand with space from context and return the watering result', async () => {
      const wateringResult = {
        plantingSpotId: SPOT_ID,
        wateredPlantIds: ['plant-1'],
        failedPlants: [],
      };
      commandBus.execute.mockResolvedValue(wateringResult);

      const input: PlantingSpotWaterRequestDto = { id: SPOT_ID };

      const result = await sut.plantingSpotWater(input, mockUser);

      expect(spaceContext.require).toHaveBeenCalledTimes(1);
      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(WaterPlantingSpotCommand),
      );
      expect(result).toEqual(wateringResult);
    });
  });

  describe('plantingSpotDelete()', () => {
    it('should execute DeletePlantingSpotCommand', async () => {
      commandBus.execute.mockResolvedValue(undefined);
      mutationResponseGraphQLMapper.toResponseDto.mockReturnValue({
        success: true,
        message: 'Planting spot deleted successfully',
        id: SPOT_ID,
      } as MutationResponseDto);

      const input: PlantingSpotDeleteRequestDto = { id: SPOT_ID };

      const result = await sut.plantingSpotDelete(input, mockUser);

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(DeletePlantingSpotCommand),
      );
      expect(result.success).toBe(true);
    });
  });
});
