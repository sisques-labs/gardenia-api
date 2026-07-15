import { QueryBus } from '@nestjs/cqrs';

import { PlantIdentificationFindByIdQuery } from '@contexts/plant-identification/application/queries/plant-identification-find-by-id/plant-identification-find-by-id.query';
import { PlantIdentificationFindByIdMcpTool } from './plant-identification-find-by-id.tool';

const ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantIdentificationFindByIdMcpTool', () => {
  let tool: PlantIdentificationFindByIdMcpTool;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    queryBus = { execute: jest.fn() } as unknown as jest.Mocked<QueryBus>;
    tool = new PlantIdentificationFindByIdMcpTool(queryBus);
  });

  it('exposes its metadata', () => {
    expect(tool.name).toBe('plant_identification_find_by_id');
    expect(tool.inputSchema).toHaveProperty('id');
  });

  it('dispatches PlantIdentificationFindByIdQuery and serializes the result', async () => {
    const viewModel = { id: ID, status: 'resolved' };
    queryBus.execute.mockResolvedValueOnce(viewModel);

    const result = await tool.execute({ id: ID });

    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.any(PlantIdentificationFindByIdQuery),
    );
    expect(result.content[0]).toEqual({
      type: 'text',
      text: JSON.stringify(viewModel),
    });
  });

  it('serializes null when not found', async () => {
    queryBus.execute.mockResolvedValueOnce(null);

    const result = await tool.execute({ id: ID });

    expect(result.content[0]).toEqual({ type: 'text', text: 'null' });
  });
});
