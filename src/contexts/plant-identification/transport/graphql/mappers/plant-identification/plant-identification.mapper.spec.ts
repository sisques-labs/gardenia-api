import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationGraphQLMapper } from './plant-identification.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<PlantIdentificationViewModel> = {},
): PlantIdentificationViewModel =>
  new PlantIdentificationViewModel({
    id: ID,
    requestedByUserId: '660e8400-e29b-41d4-a716-446655440001',
    spaceId: '770e8400-e29b-41d4-a716-446655440002',
    status: PlantIdentificationStatusEnum.RESOLVED,
    resolvedGbifKey: 2882337,
    resolvedScientificName: 'Monstera deliciosa',
    convertedToPlantId: null,
    photos: [
      {
        fileId: '330e8400-e29b-41d4-a716-446655440004',
        url: '/api/files/330e8400/content',
        organ: PlantIdentificationOrganEnum.LEAF,
        position: 0,
      },
    ],
    candidates: [
      {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Swiss cheese plant'],
        score: 0.85,
        rank: 0,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('PlantIdentificationGraphQLMapper', () => {
  let mapper: PlantIdentificationGraphQLMapper;

  beforeEach(() => {
    mapper = new PlantIdentificationGraphQLMapper();
  });

  it('maps every field from the view model, including nested photos/candidates', () => {
    const dto = mapper.toResponseDto(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.status).toBe(PlantIdentificationStatusEnum.RESOLVED);
    expect(dto.resolvedGbifKey).toBe(2882337);
    expect(dto.photos).toHaveLength(1);
    expect(dto.candidates).toHaveLength(1);
    expect(dto.photos[0].organ).toBe(PlantIdentificationOrganEnum.LEAF);
  });

  it('maps null resolved fields for a no_match identification', () => {
    const dto = mapper.toResponseDto(
      buildViewModel({
        status: PlantIdentificationStatusEnum.NO_MATCH,
        resolvedGbifKey: null,
        resolvedScientificName: null,
      }),
    );

    expect(dto.resolvedGbifKey).toBeNull();
    expect(dto.resolvedScientificName).toBeNull();
  });

  it('maps a paginated result', () => {
    const paginated = new PaginatedResult([buildViewModel()], 1, 1, 20);

    const dto = mapper.toPaginatedResponseDto(paginated);

    expect(dto.total).toBe(1);
    expect(dto.items).toHaveLength(1);
  });
});
