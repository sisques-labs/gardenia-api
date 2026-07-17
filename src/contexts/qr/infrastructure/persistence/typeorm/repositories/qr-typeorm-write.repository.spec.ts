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
  e.targetUrl = 'https://gardenia.app/spaces/770e8400';
  e.pngImage = Buffer.from('fake-png');
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
    .withTargetUrl('https://gardenia.app/spaces/770e8400')
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
      findOne: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<Repository<QrTypeOrmEntity>>;

    mapper = new QrTypeOrmMapper(new QrBuilder());

    spaceContext = {
      require: jest.fn().mockReturnValue(SPACE_ID),
    };

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
      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { id: QR_ID, spaceId: SPACE_ID },
      });
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('save()', () => {
    it('persists the entity and returns the mapped aggregate', async () => {
      rawRepo.save.mockResolvedValue(buildEntity());
      const aggregate = buildAggregate();
      const pngImage = Buffer.from('new-png');

      const result = await repository.save(aggregate, pngImage);

      expect(rawRepo.save).toHaveBeenCalledTimes(1);
      expect(result.toPrimitives().id).toBe(QR_ID);
      expect(result.toPrimitives().targetUrl).toBe(
        'https://gardenia.app/spaces/770e8400',
      );
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
