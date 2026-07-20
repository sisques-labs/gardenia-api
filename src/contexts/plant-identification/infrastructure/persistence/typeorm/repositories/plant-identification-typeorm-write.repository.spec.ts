import { EntityManager, Repository } from 'typeorm';

import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationCandidateCommonNameTypeOrmEntity } from '../entities/plant-identification-candidate-common-name.entity';
import { PlantIdentificationCandidateTypeOrmEntity } from '../entities/plant-identification-candidate.entity';
import { PlantIdentificationPhotoTypeOrmEntity } from '../entities/plant-identification-photo.entity';
import { PlantIdentificationTypeOrmEntity } from '../entities/plant-identification.entity';
import { PlantIdentificationTypeOrmMapper } from '../mappers/plant-identification-typeorm.mapper';
import { PlantIdentificationTypeOrmWriteRepository } from './plant-identification-typeorm-write.repository';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const CANDIDATE_ID = 'cc0e8400-e29b-41d4-a716-446655440006';

const buildResolvedAggregate = (): PlantIdentificationAggregate =>
  new PlantIdentificationBuilder()
    .withId(ID)
    .withRequestedByUserId(USER_ID)
    .withSpaceId('990e8400-e29b-41d4-a716-446655440099')
    .withResolved({
      speciesKey: 2882337,
      scientificName: 'Monstera deliciosa',
      provider: 'gbif',
    })
    .withPhotos([
      {
        fileId: FILE_ID,
        url: '/api/files/330e8400/content',
        organ: PlantIdentificationOrganEnum.LEAF,
        position: 0,
      },
    ])
    .withCandidates([
      {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Swiss cheese plant', 'Monstera'],
        score: 0.9,
        rank: 0,
      },
    ])
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

const buildEmptyAggregate = (): PlantIdentificationAggregate =>
  new PlantIdentificationBuilder()
    .withId(ID)
    .withRequestedByUserId(USER_ID)
    .withSpaceId(SPACE_ID)
    .withResolved(null)
    .withPhotos([])
    .withCandidates([])
    .withCreatedAt(new Date('2026-01-01'))
    .withUpdatedAt(new Date('2026-01-01'))
    .build();

describe('PlantIdentificationTypeOrmWriteRepository', () => {
  let repository: PlantIdentificationTypeOrmWriteRepository;
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
  let em: jest.Mocked<EntityManager>;
  let spaceContext: { require: jest.Mock };

  beforeEach(() => {
    em = {
      save: jest.fn().mockImplementation((_entityClass, entity) => entity),
      delete: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    rawRepo = {
      findOne: jest.fn(),
      delete: jest.fn(),
      manager: {
        transaction: jest
          .fn()
          .mockImplementation(
            (fn: (manager: EntityManager) => Promise<unknown>) => fn(em),
          ),
      },
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

    repository = new PlantIdentificationTypeOrmWriteRepository(
      mapper,
      rawRepo,
      photoRepository,
      candidateRepository,
      candidateCommonNameRepository,
      spaceContext as any,
    );
  });

  describe('save()', () => {
    it('stamps the active space onto the parent row before persisting', async () => {
      await repository.save(buildResolvedAggregate());

      expect(em.save).toHaveBeenCalledWith(
        PlantIdentificationTypeOrmEntity,
        expect.objectContaining({ spaceId: SPACE_ID }),
      );
    });

    it("deletes and reinserts photos, candidates, and each candidate's common names", async () => {
      // Candidate row gets its id populated by the (mocked) insert, exactly
      // like a real TypeORM save() would after the DB assigns it.
      em.save.mockImplementation((entityClass, entity) => {
        if (entityClass === PlantIdentificationCandidateTypeOrmEntity) {
          return Promise.resolve(
            (entity as PlantIdentificationCandidateTypeOrmEntity[]).map(
              (candidate) => ({ ...candidate, id: CANDIDATE_ID }),
            ),
          );
        }
        return Promise.resolve(entity);
      });

      await repository.save(buildResolvedAggregate());

      expect(em.delete).toHaveBeenCalledWith(
        PlantIdentificationPhotoTypeOrmEntity,
        { plantIdentificationId: ID },
      );
      expect(em.save).toHaveBeenCalledWith(
        PlantIdentificationPhotoTypeOrmEntity,
        expect.arrayContaining([expect.objectContaining({ fileId: FILE_ID })]),
      );

      expect(em.delete).toHaveBeenCalledWith(
        PlantIdentificationCandidateTypeOrmEntity,
        { plantIdentificationId: ID },
      );
      expect(em.save).toHaveBeenCalledWith(
        PlantIdentificationCandidateTypeOrmEntity,
        expect.arrayContaining([
          expect.objectContaining({ scientificName: 'Monstera deliciosa' }),
        ]),
      );

      expect(em.save).toHaveBeenCalledWith(
        PlantIdentificationCandidateCommonNameTypeOrmEntity,
        expect.arrayContaining([
          expect.objectContaining({
            candidateId: CANDIDATE_ID,
            name: 'Swiss cheese plant',
            position: 0,
          }),
          expect.objectContaining({
            candidateId: CANDIDATE_ID,
            name: 'Monstera',
            position: 1,
          }),
        ]),
      );
    });

    it('skips photo/candidate/common-name inserts when there are none, but still deletes stale rows', async () => {
      await repository.save(buildEmptyAggregate());

      expect(em.delete).toHaveBeenCalledWith(
        PlantIdentificationPhotoTypeOrmEntity,
        { plantIdentificationId: ID },
      );
      expect(em.delete).toHaveBeenCalledWith(
        PlantIdentificationCandidateTypeOrmEntity,
        { plantIdentificationId: ID },
      );
      expect(em.save).not.toHaveBeenCalledWith(
        PlantIdentificationPhotoTypeOrmEntity,
        expect.anything(),
      );
      expect(em.save).not.toHaveBeenCalledWith(
        PlantIdentificationCandidateTypeOrmEntity,
        expect.anything(),
      );
      expect(em.save).not.toHaveBeenCalledWith(
        PlantIdentificationCandidateCommonNameTypeOrmEntity,
        expect.anything(),
      );
    });

    it('returns the same aggregate instance it was given', async () => {
      const aggregate = buildEmptyAggregate();

      const result = await repository.save(aggregate);

      expect(result).toBe(aggregate);
    });
  });

  describe('findById()', () => {
    it('returns the reconstructed aggregate, with children, when found', async () => {
      const parent = new PlantIdentificationTypeOrmEntity();
      Object.assign(parent, {
        id: ID,
        requestedByUserId: USER_ID,
        spaceId: SPACE_ID,
        status: 'RESOLVED',
        resolvedSpeciesKey: 2882337,
        resolvedScientificName: 'Monstera deliciosa',
        resolvedSpeciesProvider: 'gbif',
        convertedToPlantId: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
      });

      const candidate = new PlantIdentificationCandidateTypeOrmEntity();
      Object.assign(candidate, {
        id: CANDIDATE_ID,
        plantIdentificationId: ID,
        scientificName: 'Monstera deliciosa',
        score: 0.9,
        rank: 0,
      });

      const commonName =
        new PlantIdentificationCandidateCommonNameTypeOrmEntity();
      Object.assign(commonName, {
        candidateId: CANDIDATE_ID,
        name: 'Swiss cheese plant',
        position: 0,
      });

      rawRepo.findOne.mockResolvedValue(parent);
      photoRepository.find.mockResolvedValue([]);
      candidateRepository.find.mockResolvedValue([candidate]);
      candidateCommonNameRepository.find.mockResolvedValue([commonName]);

      const result = await repository.findById(ID);

      expect(result).toBeInstanceOf(PlantIdentificationAggregate);
      expect(result!.id.value).toBe(ID);
      expect(result!.candidates[0].commonNames.map((n) => n.value)).toEqual([
        'Swiss cheese plant',
      ]);
      expect(candidateCommonNameRepository.find).toHaveBeenCalledWith({
        where: { candidateId: expect.anything() },
      });
    });

    it('returns null when the parent row is not found', async () => {
      rawRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
      expect(photoRepository.find).not.toHaveBeenCalled();
    });

    it('does not query common names when there are no candidates', async () => {
      const parent = new PlantIdentificationTypeOrmEntity();
      Object.assign(parent, {
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

      rawRepo.findOne.mockResolvedValue(parent);
      photoRepository.find.mockResolvedValue([]);
      candidateRepository.find.mockResolvedValue([]);

      await repository.findById(ID);

      expect(candidateCommonNameRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('findByCriteria()', () => {
    it('throws not implemented', async () => {
      await expect(repository.findByCriteria(undefined as any)).rejects.toThrow(
        'Method not implemented.',
      );
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
