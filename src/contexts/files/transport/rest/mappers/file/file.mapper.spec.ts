import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileRestResponseDto } from '../../dtos/file-rest-response.dto';
import { FileRestMapper } from './file.mapper';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

describe('FileRestMapper', () => {
  let mapper: FileRestMapper;

  beforeEach(() => {
    mapper = new FileRestMapper();
  });

  it('should map a FileViewModel to a FileRestResponseDto', () => {
    const viewModel = new FileViewModel({
      id: FILE_ID,
      filename: 'rose.png',
      mimeType: 'image/png',
      size: 204800,
      storageKey: FILE_ID,
      url: '/api/files/550e8400/content',
      userId: USER_ID,
      spaceId: SPACE_ID,
      createdAt: NOW,
      updatedAt: NOW,
    });

    const dto = mapper.toResponse(viewModel);

    expect(dto).toBeInstanceOf(FileRestResponseDto);
    expect(dto.id).toBe(FILE_ID);
    expect(dto.filename).toBe('rose.png');
    expect(dto.mimeType).toBe('image/png');
    expect(dto.size).toBe(204800);
    expect(dto.url).toBe('/api/files/550e8400/content');
    expect(dto.userId).toBe(USER_ID);
    expect(dto.spaceId).toBe(SPACE_ID);
    expect(dto.createdAt).toEqual(NOW);
    expect(dto.updatedAt).toEqual(NOW);
  });
});
