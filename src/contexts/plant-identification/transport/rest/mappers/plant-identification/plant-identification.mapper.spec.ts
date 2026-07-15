import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationViewModel } from '@contexts/plant-identification/domain/view-models/plant-identification.view-model';
import { PlantIdentificationRestMapper } from './plant-identification.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantIdentificationRestMapper', () => {
  const mapper = new PlantIdentificationRestMapper();

  it('toIdentifyResponse() maps an IdentifyPlantResult', () => {
    const dto = mapper.toIdentifyResponse({
      id: ID,
      status: PlantIdentificationStatusEnum.RESOLVED,
      resolved: { gbifKey: 2882337, scientificName: 'Monstera deliciosa' },
      candidates: [
        {
          scientificName: 'Monstera deliciosa',
          commonNames: [],
          score: 0.85,
          rank: 0,
        },
      ],
      photos: [
        {
          fileId: 'file-1',
          url: '/api/files/1',
          organ: PlantIdentificationOrganEnum.LEAF,
          position: 0,
        },
      ],
      createdAt: new Date('2026-01-01'),
    });

    expect(dto.id).toBe(ID);
    expect(dto.resolved).toEqual({
      gbifKey: 2882337,
      scientificName: 'Monstera deliciosa',
    });
    expect(dto.photos).toEqual([
      {
        url: '/api/files/1',
        organ: PlantIdentificationOrganEnum.LEAF,
        position: 0,
      },
    ]);
  });

  it('toResponse() maps a PlantIdentificationViewModel', () => {
    const vm = new PlantIdentificationViewModel({
      id: ID,
      requestedByUserId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
      status: PlantIdentificationStatusEnum.NO_MATCH,
      resolvedGbifKey: null,
      resolvedScientificName: null,
      convertedToPlantId: null,
      photos: [],
      candidates: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(ID);
    expect(dto.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(dto.resolvedGbifKey).toBeNull();
  });
});
