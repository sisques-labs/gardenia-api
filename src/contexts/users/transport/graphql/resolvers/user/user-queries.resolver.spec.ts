import { UserFindByCriteriaQuery } from '@contexts/users/application/queries/user-find-by-criteria/user-find-by-criteria.query';
import { UserFindByIdQuery } from '@contexts/users/application/queries/user-find-by-id/user-find-by-id.query';
import { UserGraphQLMapper } from '@contexts/users/transport/graphql/mappers/user/user.mapper';
import { QueryBus } from '@nestjs/cqrs';

import { UserQueriesResolver } from './user-queries.resolver';

describe('UserQueriesResolver', () => {
  let sut: UserQueriesResolver;
  let queryBus: jest.Mocked<QueryBus>;
  let userGraphQLMapper: jest.Mocked<UserGraphQLMapper>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    userGraphQLMapper = {
      toResponseDtoFromViewModel: jest.fn(),
      toPaginatedResponseDto: jest.fn(),
    } as unknown as jest.Mocked<UserGraphQLMapper>;
    sut = new UserQueriesResolver(queryBus, userGraphQLMapper);
  });

  describe('userFindById()', () => {
    it('should execute UserFindByIdQuery with the given id', async () => {
      queryBus.execute.mockResolvedValue(null);

      await sut.userFindById({ id: '550e8400-e29b-41d4-a716-446655440001' });

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(UserFindByIdQuery),
      );
    });

    it('should return mapped DTO when user is found', async () => {
      const mockViewModel = {
        id: '550e8400-e29b-41d4-a716-446655440001',
      } as any;
      const mockDto = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        username: 'johndoe',
      } as any;
      queryBus.execute.mockResolvedValue(mockViewModel);
      userGraphQLMapper.toResponseDtoFromViewModel.mockReturnValue(mockDto);

      const result = await sut.userFindById({
        id: '550e8400-e29b-41d4-a716-446655440001',
      });

      expect(userGraphQLMapper.toResponseDtoFromViewModel).toHaveBeenCalledWith(
        mockViewModel,
      );
      expect(result).toBe(mockDto);
    });

    it('should return null when user is not found', async () => {
      queryBus.execute.mockResolvedValue(null);

      const result = await sut.userFindById({
        id: '550e8400-e29b-41d4-a716-000000000000',
      });

      expect(result).toBeNull();
      expect(
        userGraphQLMapper.toResponseDtoFromViewModel,
      ).not.toHaveBeenCalled();
    });
  });

  describe('usersFindByCriteria()', () => {
    it('should execute UserFindByCriteriaQuery', async () => {
      const mockPaginatedResult = {
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      };
      const mockDto = { items: [], total: 0 } as any;
      queryBus.execute.mockResolvedValue(mockPaginatedResult);
      userGraphQLMapper.toPaginatedResponseDto.mockReturnValue(mockDto);

      await sut.usersFindByCriteria(undefined);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      expect(queryBus.execute).toHaveBeenCalledWith(
        expect.any(UserFindByCriteriaQuery),
      );
    });

    it('should return mapped paginated DTO', async () => {
      const mockPaginatedResult = {
        items: [],
        total: 0,
        page: 1,
        perPage: 10,
        totalPages: 0,
      };
      const mockDto = { items: [], total: 0 } as any;
      queryBus.execute.mockResolvedValue(mockPaginatedResult);
      userGraphQLMapper.toPaginatedResponseDto.mockReturnValue(mockDto);

      const result = await sut.usersFindByCriteria(undefined);

      expect(userGraphQLMapper.toPaginatedResponseDto).toHaveBeenCalledWith(
        mockPaginatedResult,
      );
      expect(result).toBe(mockDto);
    });
  });
});
