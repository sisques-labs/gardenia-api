import { Repository } from 'typeorm';

import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrTypeOrmEntity } from '../entities/qr.entity';
import { QrTypeOrmMapper } from '../mappers/qr-typeorm.mapper';
import { QrTypeOrmWriteRepository } from './qr-typeorm-write.repository';

const QR_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';

const buildEntity = (
  overrides: Partial<QrTypeOrmEntity> = {},
): QrTypeOrmEntity => {
  const e = new QrTypeOrmEntity();
  e.id = QR_ID;
  e.spaceId = SPACE_ID;
  e.targetUrl = 'https://gardenia.app/plant/1';
  e.pngImage = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  e.generation = 1;
  e.expiresAt = null;
  e.createdAt = new Date('2026-01-01');
  e.updatedAt = new Date('2026-01-01');
  return { ...e, ...overrides };
};

const buildAggregate = () =>
  new QrBuilder()
    .withId(QR_ID)
    .withSpaceId(SPACE_ID)
    .withTargetUrl('https://gardenia.app/plant/1')
    .withGeneration(1)
    .withExpiresAt(null)
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('QrTypeOrmWriteRepository', () => {
  let repository: QrTypeOrmWriteRepository;
  let rawRepo: jest.Mocked<Repository<QrTypeOrmEntity>>;
  let mapper: QrTypeOrmMapper;
  let spaceContext: { require: jest.Mock };

  beforeEach(() => {
    rawRepo = {
      save: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<QrTypeOrmEntity>>;

    mapper = new QrTypeOrmMapper(new QrBuilder());

    spaceContext = { require: jest.fn().mockReturnValue(SPACE_ID) };

    repository = new QrTypeOrmWriteRepository(
      mapper,
      rawRepo,
      spaceContext as any,
    );
  });

  describe('findById()', () => {
    it('returns aggregate when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(QR_ID);

      expect(result).not.toBeNull();
      expect(result!.toPrimitives().id).toBe(QR_ID);
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('save()', () => {
    it('persists the entity with the png image and returns the domain object', async () => {
      const entity = buildEntity();
      rawRepo.save.mockResolvedValue(entity);
      const aggregate = buildAggregate();
      const png = Buffer.from([1, 2, 3]);

      const result = await repository.save(aggregate, png);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      const savedArg = rawRepo.save.mock.calls[0][0];
      expect(savedArg.pngImage).toBe(png);
      expect(result.toPrimitives().id).toBe(QR_ID);
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(QR_ID);

      expect(rawRepo.delete).toHaveBeenCalledWith({
        id: QR_ID,
        spaceId: SPACE_ID,
      });
    });
  });
});
