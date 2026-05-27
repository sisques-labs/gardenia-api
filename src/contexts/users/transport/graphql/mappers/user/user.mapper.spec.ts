import { UserViewModel } from '@contexts/users/domain/view-models/user.view-model';
import { UserGraphQLMapper } from '@contexts/users/transport/graphql/mappers/user/user.mapper';

describe('UserGraphQLMapper', () => {
  let mapper: UserGraphQLMapper;

  beforeEach(() => {
    mapper = new UserGraphQLMapper();
  });

  describe('toResponseDtoFromViewModel', () => {
    it('maps all profile fields when fully populated', () => {
      const viewModel = new UserViewModel({
        id: 'user-id-1',
        status: 'active',
        username: 'john_doe',
        firstName: 'John',
        lastName: 'Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        bio: 'Software engineer',
        locale: 'en-US',
        timezone: 'America/New_York',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-06-01T00:00:00.000Z'),
      });

      const result = mapper.toResponseDtoFromViewModel(viewModel);

      expect(result.id).toBe('user-id-1');
      expect(result.status).toBe('active');
      expect(result.username).toBe('john_doe');
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
      expect(result.avatarUrl).toBe('https://example.com/avatar.jpg');
      expect(result.bio).toBe('Software engineer');
      expect(result.locale).toBe('en-US');
      expect(result.timezone).toBe('America/New_York');
      expect(result.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'));
      expect(result.updatedAt).toEqual(new Date('2024-06-01T00:00:00.000Z'));
    });

    it('maps nullable fields as null when not populated', () => {
      const viewModel = new UserViewModel({
        id: 'user-id-2',
        status: 'active',
        username: 'jane_doe',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        bio: null,
        locale: null,
        timezone: null,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const result = mapper.toResponseDtoFromViewModel(viewModel);

      expect(result.username).toBe('jane_doe');
      expect(result.firstName).toBeNull();
      expect(result.lastName).toBeNull();
      expect(result.avatarUrl).toBeNull();
      expect(result.bio).toBeNull();
      expect(result.locale).toBeNull();
      expect(result.timezone).toBeNull();
    });
  });

  describe('toPaginatedResponseDto', () => {
    it('maps paginated result including profile fields for each item', () => {
      const viewModel = new UserViewModel({
        id: 'user-id-3',
        status: 'active',
        username: 'paginated_user',
        firstName: 'Page',
        lastName: 'User',
        avatarUrl: null,
        bio: null,
        locale: 'es-AR',
        timezone: 'America/Buenos_Aires',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const paginatedResult = {
        items: [viewModel],
        total: 1,
        page: 1,
        perPage: 10,
        totalPages: 1,
      };

      const result = mapper.toPaginatedResponseDto(paginatedResult);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].username).toBe('paginated_user');
      expect(result.items[0].locale).toBe('es-AR');
      expect(result.items[0].timezone).toBe('America/Buenos_Aires');
      expect(result.total).toBe(1);
    });
  });
});
