import { QueryBus } from '@nestjs/cqrs';

import { PlantPhotoFindByIdQuery } from '@contexts/plant-photos/application/queries/plant-photo-find-by-id/plant-photo-find-by-id.query';
import { PlantPhotoFindByIdMcpTool } from './plant-photo-find-by-id.tool';

const PHOTO_ID = '11111111-1111-4111-8111-111111111111';

describe('PlantPhotoFindByIdMcpTool', () => {
  let tool: PlantPhotoFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantPhotoFindByIdMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_photo_find_by_id');
    expect(tool.inputSchema).toHaveProperty('id');
  });

  it('dispatches PlantPhotoFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: PHOTO_ID, url: 'https://example.com/photo.jpg' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: PHOTO_ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantPhotoFindByIdQuery),
    );
    const query = queryBus.execute.mock.calls[0][0] as PlantPhotoFindByIdQuery;
    expect(query.id.value).toBe(PHOTO_ID);
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when the plant photo is not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: PHOTO_ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
