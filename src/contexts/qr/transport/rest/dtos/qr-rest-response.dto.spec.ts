import { QrRestResponseDto } from './qr-rest-response.dto';

describe('QrRestResponseDto', () => {
  it('holds all fields of a qr code', () => {
    const now = new Date('2026-06-27T00:00:00.000Z');
    const dto = new QrRestResponseDto();
    dto.id = '550e8400-e29b-41d4-a716-446655440000';
    dto.spaceId = '770e8400-e29b-41d4-a716-446655440002';
    dto.targetUrl = 'https://gardenia.app/plant/1';
    dto.generation = 1;
    dto.expiresAt = null;
    dto.createdAt = now;
    dto.updatedAt = now;

    expect(dto.generation).toBe(1);
    expect(dto.expiresAt).toBeNull();
  });
});
