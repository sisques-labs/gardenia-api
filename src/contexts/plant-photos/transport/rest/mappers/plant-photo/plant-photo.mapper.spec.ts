import { PlantPhotoViewModel } from '@contexts/plant-photos/domain/view-models/plant-photo.view-model';
import { PlantPhotoRestMapper } from './plant-photo.mapper';

describe('PlantPhotoRestMapper', () => {
  it('maps a view model to a response dto', () => {
    const vm = new PlantPhotoViewModel({
      id: '550e8400-e29b-41d4-a716-446655440000',
      plantId: '440e8400-e29b-41d4-a716-446655440003',
      fileId: '330e8400-e29b-41d4-a716-446655440004',
      url: '/api/files/330e8400/content',
      userId: '660e8400-e29b-41d4-a716-446655440001',
      spaceId: '770e8400-e29b-41d4-a716-446655440002',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    });

    const mapper = new PlantPhotoRestMapper();
    const dto = mapper.toResponse(vm);

    expect(dto.id).toBe(vm.id);
    expect(dto.plantId).toBe(vm.plantId);
    expect(dto.fileId).toBe(vm.fileId);
    expect(dto.url).toBe(vm.url);
  });
});
