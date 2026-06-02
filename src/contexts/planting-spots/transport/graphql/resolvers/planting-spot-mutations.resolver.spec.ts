import { CommandBus } from '@nestjs/cqrs';
import {
  MutationResponseDto,
  MutationResponseGraphQLMapper,
} from '@sisques-labs/nestjs-kit';

import { PlantingSpotTypeEnum } from '@contexts/planting-spots/domain/enums/planting-spot-type.enum';
import { CreatePlantingSpotGraphQLDto } from '../dtos/requests/create-planting-spot-graphql.dto';
import { UpdatePlantingSpotGraphQLDto } from '../dtos/requests/update-planting-spot-graphql.dto';
import { PlantingSpotMutationsResolver } from './planting-spot-mutations.resolver';

const SPOT_ID = '11111111-1111-4111-8111-111111111111';
const USER_ID = '22222222-2222-4222-8222-222222222222';
const SPACE_ID = '33333333-3333-4333-8333-333333333333';

const mockUser = { userId: USER_ID, email: 'test@test.com' };

const successResponse: MutationResponseDto = {
  success: true,
  message: 'Done',
  id: SPOT_ID,
};

describe('PlantingSpotMutationsResolver', () => {
  let resolver: PlantingSpotMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseMapper: jest.Mocked<MutationResponseGraphQLMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;

    resolver = new PlantingSpotMutationsResolver(
      commandBus,
      mutationResponseMapper,
    );
  });

  describe('createPlantingSpot', () => {
    it('dispatches CreatePlantingSpotCommand and returns mutation response', async () => {
      commandBus.execute.mockResolvedValueOnce(SPOT_ID);
      mutationResponseMapper.toResponseDto.mockReturnValueOnce(successResponse);

      const input: CreatePlantingSpotGraphQLDto = {
        name: 'North Bed',
        type: PlantingSpotTypeEnum.RAISED_BED,
      };

      const result = await resolver.createPlantingSpot(
        input,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
      expect(result.id).toBe(SPOT_ID);
    });
  });

  describe('updatePlantingSpot', () => {
    it('dispatches UpdatePlantingSpotCommand and returns mutation response', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      mutationResponseMapper.toResponseDto.mockReturnValueOnce(successResponse);

      const input: UpdatePlantingSpotGraphQLDto = {
        id: SPOT_ID,
        name: 'Updated Bed',
      };

      const result = await resolver.updatePlantingSpot(
        input,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });
  });

  describe('deletePlantingSpot', () => {
    it('dispatches DeletePlantingSpotCommand and returns mutation response', async () => {
      commandBus.execute.mockResolvedValueOnce(undefined);
      mutationResponseMapper.toResponseDto.mockReturnValueOnce(successResponse);

      const result = await resolver.deletePlantingSpot(
        SPOT_ID,
        mockUser,
        SPACE_ID,
      );

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });
  });
});
