import { CommandBus } from '@nestjs/cqrs';

import { IPlantSpeciesImportPort } from '@contexts/plant-species/application/ports/plant-species-import.port';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

import { EnrichPlantSpeciesCommand } from './enrich-plant-species.command';
import { EnrichPlantSpeciesCommandHandler } from './enrich-plant-species.handler';

const NOW = new Date('2024-01-01');

describe('EnrichPlantSpeciesCommandHandler', () => {
  let handler: EnrichPlantSpeciesCommandHandler;
  let importPort: jest.Mocked<IPlantSpeciesImportPort>;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let commandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    importPort = {
      fetchPage: jest.fn(),
      fetchByScientificName: jest.fn(),
    };

    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findByScientificName: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IPlantSpeciesWriteRepository>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<CommandBus>;

    handler = new EnrichPlantSpeciesCommandHandler(
      importPort,
      writeRepository,
      commandBus,
    );
  });

  it('returns null when port finds no enrichment data', async () => {
    importPort.fetchByScientificName.mockResolvedValue(null);

    const result = await handler.execute(
      new EnrichPlantSpeciesCommand({ scientificName: 'mesa' }),
    );

    expect(result).toBeNull();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('updates existing species when enrichment data is found', async () => {
    const existing = new PlantSpeciesBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withScientificName('Monstera deliciosa')
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    importPort.fetchByScientificName.mockResolvedValue({
      scientificName: 'Monstera deliciosa',
      description: 'Tropical plant',
      imageUrl: 'https://example.com/img.jpg',
    });
    writeRepository.findByScientificName.mockResolvedValue(existing);
    commandBus.execute.mockResolvedValue(undefined);

    const result = await handler.execute(
      new EnrichPlantSpeciesCommand({ scientificName: 'Monstera deliciosa' }),
    );

    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.objectContaining({ value: existing.id.value }),
        description: expect.objectContaining({ value: 'Tropical plant' }),
        imageUrl: expect.objectContaining({
          value: 'https://example.com/img.jpg',
        }),
      }),
    );
  });

  it('creates and enriches species when not in database', async () => {
    importPort.fetchByScientificName.mockResolvedValue({
      scientificName: 'Ocimum basilicum',
      description: 'Basil',
      imageUrl: null,
    });
    writeRepository.findByScientificName.mockResolvedValue(null);
    commandBus.execute
      .mockResolvedValueOnce('660e8400-e29b-41d4-a716-446655440001')
      .mockResolvedValueOnce(undefined);

    const result = await handler.execute(
      new EnrichPlantSpeciesCommand({ scientificName: 'Ocimum basilicum' }),
    );

    expect(result).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
  });

  it('uses canonical scientific name from enrichment when creating', async () => {
    importPort.fetchByScientificName.mockResolvedValue({
      scientificName: 'Monstera deliciosa',
      description: 'Desc',
      imageUrl: null,
    });
    writeRepository.findByScientificName.mockResolvedValue(null);
    commandBus.execute
      .mockResolvedValueOnce('660e8400-e29b-41d4-a716-446655440001')
      .mockResolvedValueOnce(undefined);

    await handler.execute(
      new EnrichPlantSpeciesCommand({ scientificName: 'monstera deliciosa' }),
    );

    expect(commandBus.execute).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        scientificName: expect.objectContaining({
          value: 'Monstera deliciosa',
        }),
      }),
    );
  });
});
