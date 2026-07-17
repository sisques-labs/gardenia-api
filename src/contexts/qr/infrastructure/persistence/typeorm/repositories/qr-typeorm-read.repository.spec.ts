import { Repository } from 'typeorm';

import { QrBuilder } from '@contexts/qr/domain/builders/qr.builder';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { QrTypeOrmEntity } from '../entities/qr.entity';
import { QrTypeOrmMapper } from '../mappers/qr-typeorm.mapper';
import { QrTypeOrmReadRepository } from './qr-typeorm-read.repository';

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

describe('QrTypeOrmReadRepository', () => {
  let repository: QrTypeOrmReadRepository;
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

    repository = new QrTypeOrmReadRepository(
      rawRepo,
      mapper,
      spaceContext as any,
    );
  });

  describe('findById()', () => {
    it('returns QrViewModel when entity is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildEntity());

      const result = await repository.findById(QR_ID);

      expect(result).toBeInstanceOf(QrViewModel);
      expect(result!.id).toBe(QR_ID);
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

  describe('findPngById()', () => {
    it('returns the png buffer when entity is found', async () => {
      const entity = buildEntity();
      rawRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findPngById(QR_ID);

      expect(result).toBe(entity.pngImage);
      expect(rawRepo.findOne).toHaveBeenCalledWith({
        where: { id: QR_ID, spaceId: SPACE_ID },
        select: { id: true, pngImage: true, spaceId: true },
      });
    });

    it('returns null when entity is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findPngById('nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when entity has no pngImage', async () => {
      rawRepo.findOne.mockResolvedValue(
        buildEntity({ pngImage: undefined as any }),
      );

      const result = await repository.findPngById(QR_ID);

      expect(result).toBeNull();
    });
  });
});
