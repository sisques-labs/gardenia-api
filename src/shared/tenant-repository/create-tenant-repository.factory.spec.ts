import { Repository } from 'typeorm';

import { SpaceContextMissingException } from '@contexts/spaces/domain/exceptions/space-context-missing.exception';
import { SpaceContext } from '../space-context/space-context.service';
import { createTenantRepository } from './create-tenant-repository.factory';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';

interface TestEntity {
  id: string;
  spaceId: string;
  name: string;
}

const buildMockRepo = (): jest.Mocked<Repository<TestEntity>> =>
  ({
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  }) as unknown as jest.Mocked<Repository<TestEntity>>;

const buildSpaceContext = (spaceId?: string): SpaceContext => {
  const ctx = new SpaceContext();
  if (spaceId !== undefined) {
    // We can't easily simulate ALS outside run(), so we expose a mock
    jest.spyOn(ctx, 'require').mockReturnValue(spaceId);
    jest.spyOn(ctx, 'get').mockReturnValue(spaceId);
  } else {
    jest.spyOn(ctx, 'require').mockImplementation(() => {
      throw new SpaceContextMissingException();
    });
    jest.spyOn(ctx, 'get').mockReturnValue(undefined);
  }
  return ctx;
};

describe('createTenantRepository', () => {
  let mockRepo: jest.Mocked<Repository<TestEntity>>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo = buildMockRepo();
  });

  describe('findOne()', () => {
    it('should merge spaceId into where clause', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      await tenantRepo.findOne({ where: { name: 'test' } } as any);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { name: 'test', spaceId: SPACE_ID },
      });
    });

    it('should throw SpaceContextMissingException when context is empty', () => {
      const ctx = buildSpaceContext(undefined);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      expect(() => tenantRepo.findOne({} as any)).toThrow(
        SpaceContextMissingException,
      );
    });
  });

  describe('find()', () => {
    it('should merge spaceId into where clause', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      await tenantRepo.find({ where: { name: 'test' } } as any);

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { name: 'test', spaceId: SPACE_ID },
      });
    });

    it('should throw SpaceContextMissingException when context is empty', () => {
      const ctx = buildSpaceContext(undefined);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      expect(() => tenantRepo.find({} as any)).toThrow(
        SpaceContextMissingException,
      );
    });
  });

  describe('findAndCount()', () => {
    it('should merge spaceId into where clause', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      await tenantRepo.findAndCount({ where: { name: 'test' } } as any);

      expect(mockRepo.findAndCount).toHaveBeenCalledWith({
        where: { name: 'test', spaceId: SPACE_ID },
      });
    });

    it('should throw SpaceContextMissingException when context is empty', () => {
      const ctx = buildSpaceContext(undefined);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      expect(() => tenantRepo.findAndCount({} as any)).toThrow(
        SpaceContextMissingException,
      );
    });
  });

  describe('save()', () => {
    it('should set spaceId on the entity', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);
      const entity: TestEntity = { id: '1', spaceId: '', name: 'test' };
      mockRepo.save.mockResolvedValue({ ...entity, spaceId: SPACE_ID });

      await tenantRepo.save(entity as any);

      expect(mockRepo.save).toHaveBeenCalledWith({
        ...entity,
        spaceId: SPACE_ID,
      });
    });

    it('should throw SpaceContextMissingException when context is empty', () => {
      const ctx = buildSpaceContext(undefined);
      const tenantRepo = createTenantRepository(mockRepo, ctx);
      const entity: TestEntity = { id: '1', spaceId: '', name: 'test' };

      expect(() => tenantRepo.save(entity as any)).toThrow(
        SpaceContextMissingException,
      );
    });
  });

  describe('delete()', () => {
    it('should merge spaceId into criteria', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      await tenantRepo.delete({ id: '1' } as any);

      expect(mockRepo.delete).toHaveBeenCalledWith({
        id: '1',
        spaceId: SPACE_ID,
      });
    });

    it('should throw SpaceContextMissingException when context is empty', () => {
      const ctx = buildSpaceContext(undefined);
      const tenantRepo = createTenantRepository(mockRepo, ctx);

      expect(() => tenantRepo.delete({ id: '1' } as any)).toThrow(
        SpaceContextMissingException,
      );
    });
  });

  describe('unintercepted methods', () => {
    it('should pass through count() via Reflect.get', async () => {
      const ctx = buildSpaceContext(SPACE_ID);
      const tenantRepo = createTenantRepository(mockRepo, ctx);
      mockRepo.count.mockResolvedValue(5);

      const result = await tenantRepo.count({} as any);

      expect(mockRepo.count).toHaveBeenCalledTimes(1);
      expect(result).toBe(5);
    });
  });
});
