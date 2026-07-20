import { Criteria, PaginatedResult } from '@sisques-labs/nestjs-kit';
import { Repository, SelectQueryBuilder } from 'typeorm';

import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationCandidateCommonNameTypeOrmEntity } from '../entities/plant-identification-candidate-common-name.entity';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from '../mappers/plant-identification-typeorm.mapper';
import { PlantIdentificationTypeOrmReadRepository } from './plant-identification-typeorm-read.repository';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const CANDIDATE_ID = 'cc0e8400-e29b-41d4-a716-446655440006';

const buildParent = (): PlantIdentificationTypeOrmEntity => {
  const e = new PlantIdentificationTypeOrmEntity();
  Object.assign(e, {
    id: ID,
    requestedByUserId: USER_ID,
    spaceId: SPACE_ID,
    status: 'NO_MATCH',
    resolvedSpeciesKey: null,
    resolvedScientificName: null,
    resolvedSpeciesProvider: null,
    convertedToPlantId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });
  return e;
};

const buildCandidate = (): PlantIdentificationCandidateTypeOrmEntity => {
  const e = new PlantIdentificationCandidateTypeOrmEntity();
  Object.assign(e, {
    id: CANDIDATE_ID,
    plantIdentificationId: ID,
    scientificName: 'Monstera deliciosa',
    score: 0.9,
    rank: 0,
  });
  return e;
};

const buildCommonName =
  (): PlantIdentificationCandidateCommonNameTypeOrmEntity => {
    const e = new PlantIdentificationCandidateCommonNameTypeOrmEntity();
    Object.assign(e, {
      candidateId: CANDIDATE_ID,
      name: 'Swiss cheese plant',
      position: 0,
    });
    return e;
  };

describe('PlantIdentificationTypeOrmReadRepository', () => {
  let repository: PlantIdentificationTypeOrmReadRepository;
  let mapper: PlantIdentificationTypeOrmMapper;
  let rawRepo: jest.Mocked<Repository<PlantIdentificationTypeOrmEntity>>;
  let photoRepository: jest.Mocked<
    Repository<PlantIdentificationPhotoTypeOrmEntity>
  >;
  let candidateRepository: jest.Mocked<
    Repository<PlantIdentificationCandidateTypeOrmEntity>
  >;
  let candidateCommonNameRepository: jest.Mocked<
    Repository<PlantIdentificationCandidateCommonNameTypeOrmEntity>
  >;
  let mockQb: jest.Mocked<
    Pick<
      SelectQueryBuilder<PlantIdentificationTypeOrmEntity>,
      | 'where'
      | 'andWhere'
      | 'orderBy'
      | 'addOrderBy'
      | 'skip'
      | 'take'
      | 'getManyAndCount'
    >
  >;
  let spaceContext: { require: jest.Mock };

  beforeEach(() => {
    mockQb = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    } as any;

    rawRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQb),
    } as unknown as jest.Mocked<Repository<PlantIdentificationTypeOrmEntity>>;

    photoRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<
      Repository<PlantIdentificationPhotoTypeOrmEntity>
    >;

    candidateRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<
      Repository<PlantIdentificationCandidateTypeOrmEntity>
    >;

    candidateCommonNameRepository = {
      find: jest.fn(),
    } as unknown as jest.Mocked<
      Repository<PlantIdentificationCandidateCommonNameTypeOrmEntity>
    >;

    mapper = new PlantIdentificationTypeOrmMapper(
      new PlantIdentificationBuilder(),
    );

    spaceContext = { require: jest.fn().mockReturnValue(SPACE_ID) };

    repository = new PlantIdentificationTypeOrmReadRepository(
      rawRepo,
      photoRepository,
      candidateRepository,
      candidateCommonNameRepository,
      mapper,
      spaceContext as any,
    );
  });

  describe('findById()', () => {
    it('returns a view model with children when the parent is found', async () => {
      rawRepo.findOne.mockResolvedValue(buildParent());
      photoRepository.find.mockResolvedValue([]);
      candidateRepository.find.mockResolvedValue([buildCandidate()]);
      candidateCommonNameRepository.find.mockResolvedValue([buildCommonName()]);

      const result = await repository.findById(ID);

      expect(result).toBeInstanceOf(PlantIdentificationViewModel);
      expect(result!.id).toBe(ID);
      expect(result!.candidates[0].commonNames).toEqual(['Swiss cheese plant']);
    });

    it('returns null when the parent is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
      expect(photoRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findByCriteria()', () => {
    it('scopes the query to the active space and returns paginated view models', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildParent()], 1]);
      candidateRepository.find.mockResolvedValue([]);
      photoRepository.find.mockResolvedValue([]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(mockQb.where).toHaveBeenCalledWith(
        'identification.space_id = :spaceId',
        { spaceId: SPACE_ID },
      );
      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBeInstanceOf(PlantIdentificationViewModel);
      expect(result.total).toBe(1);
    });

    it('returns an empty result and skips child lookups when nothing matches', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(photoRepository.find).not.toHaveBeenCalled();
    });

    it('does not query common names when none of the loaded candidates have any', async () => {
      mockQb.getManyAndCount.mockResolvedValue([[buildParent()], 1]);
      candidateRepository.find.mockResolvedValue([]);
      photoRepository.find.mockResolvedValue([]);

      await repository.findByCriteria(
        new Criteria(undefined, undefined, undefined),
      );

      expect(candidateCommonNameRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('save()', () => {
    it('resolves without persisting (read-side projection)', async () => {
      await expect(
        repository.save({} as PlantIdentificationViewModel),
      ).resolves.toBeUndefined();
    });
  });

  describe('delete()', () => {
    it('calls delete on the underlying repository', async () => {
      rawRepo.delete.mockResolvedValue({ affected: 1, raw: {} });

      await repository.delete(ID);

      expect(rawRepo.delete).toHaveBeenCalledTimes(1);
    });
  });
});
