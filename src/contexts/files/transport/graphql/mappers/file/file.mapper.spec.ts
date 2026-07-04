import { PaginatedResult } from '@sisques-labs/nestjs-kit';

import { FileViewModel } from '@contexts/files/domain/view-models/file.view-model';
import { FileGraphQLMapper } from './file.mapper';

const FILE_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2024-01-01');

const buildViewModel = (): FileViewModel =>
  new FileViewModel({
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

describe('FileGraphQLMapper', () => {
  let mapper: FileGraphQLMapper;

  beforeEach(() => {
    mapper = new FileGraphQLMapper();
  });

  describe('toResponseDto()', () => {
    it('should map a FileViewModel to a FileResponseDto', () => {
      const dto = mapper.toResponseDto(buildViewModel());

      expect(dto).toEqual({
        id: FILE_ID,
        filename: 'rose.png',
        mimeType: 'image/png',
        size: 204800,
        url: '/api/files/550e8400/content',
        userId: USER_ID,
        spaceId: SPACE_ID,
        createdAt: NOW,
        updatedAt: NOW,
      });
    });
  });

  describe('toPaginatedResponseDto()', () => {
    it('should map a PaginatedResult of view models to a paginated DTO', () => {
      const paginatedResult = new PaginatedResult([buildViewModel()], 1, 1, 20);

      const dto = mapper.toPaginatedResponseDto(paginatedResult);

      expect(dto.items).toHaveLength(1);
      expect(dto.items[0].id).toBe(FILE_ID);
      expect(dto.total).toBe(1);
      expect(dto.page).toBe(1);
      expect(dto.perPage).toBe(20);
      expect(dto.totalPages).toBe(paginatedResult.totalPages);
    });

    it('should map an empty PaginatedResult', () => {
      const paginatedResult = new PaginatedResult([], 0, 1, 20);

      const dto = mapper.toPaginatedResponseDto(paginatedResult);

      expect(dto.items).toHaveLength(0);
      expect(dto.total).toBe(0);
    });
  });
});
