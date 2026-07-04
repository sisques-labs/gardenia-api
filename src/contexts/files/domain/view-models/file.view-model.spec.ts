import { FileViewModel } from './file.view-model';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01T00:00:00.000Z');

describe('FileViewModel', () => {
  it('should expose all metadata fields from the given primitives', () => {
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

    expect(viewModel.id).toBe(FILE_ID);
    expect(viewModel.filename).toBe('rose.png');
    expect(viewModel.mimeType).toBe('image/png');
    expect(viewModel.size).toBe(204800);
    expect(viewModel.storageKey).toBe(FILE_ID);
    expect(viewModel.url).toBe('/api/files/550e8400/content');
    expect(viewModel.userId).toBe(USER_ID);
    expect(viewModel.spaceId).toBe(SPACE_ID);
    expect(viewModel.createdAt).toEqual(NOW);
    expect(viewModel.updatedAt).toEqual(NOW);
  });
});
