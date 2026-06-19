import { SpaceViewModel } from '@contexts/spaces/domain/view-models/space.view-model';

import { SpaceRestMapper } from './space.mapper';

const buildMockSpaceViewModel = (): SpaceViewModel =>
  new SpaceViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Space',
    ownerId: '660e8400-e29b-41d4-a716-446655440001',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-06-01T00:00:00.000Z'),
    latitude: null,
    longitude: null,
    environment: null,
  });

describe('SpaceRestMapper', () => {
  let sut: SpaceRestMapper;

  beforeEach(() => {
    sut = new SpaceRestMapper();
  });

  describe('toResponse()', () => {
    it('should map all 5 fields from SpaceViewModel to SpaceRestResponseDto', () => {
      const vm = buildMockSpaceViewModel();

      const result = sut.toResponse(vm);

      expect(result.id).toBe(vm.id);
      expect(result.name).toBe(vm.name);
      expect(result.ownerId).toBe(vm.ownerId);
      expect(result.createdAt).toBe(vm.createdAt);
      expect(result.updatedAt).toBe(vm.updatedAt);
    });

    it('should not leak extra fields beyond the 5 declared DTO properties', () => {
      const vm = buildMockSpaceViewModel();

      const result = sut.toResponse(vm);

      const keys = Object.keys(result);
      expect(keys).toEqual(
        expect.arrayContaining([
          'id',
          'name',
          'ownerId',
          'createdAt',
          'updatedAt',
        ]),
      );
      expect(keys).toHaveLength(5);
    });

    it('should produce a new DTO instance on each call', () => {
      const vm = buildMockSpaceViewModel();

      const result1 = sut.toResponse(vm);
      const result2 = sut.toResponse(vm);

      expect(result1).not.toBe(result2);
    });
  });
});
