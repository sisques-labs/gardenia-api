import { EventBus } from '@nestjs/cqrs';

import { IPlantSpeciesImportPort } from '@contexts/plant-species/application/ports/plant-species-import.port';
import { PlantSpeciesBuilder } from '@contexts/plant-species/domain/builders/plant-species.builder';
import { IPlantSpeciesWriteRepository } from '@contexts/plant-species/domain/repositories/write/plant-species-write.repository';

import { ImportPlantSpeciesCommand } from './import-plant-species.command';
import { ImportPlantSpeciesCommandHandler } from './import-plant-species.handler';

const NOW = new Date('2024-01-01');

describe('ImportPlantSpeciesCommandHandler', () => {
  let handler: ImportPlantSpeciesCommandHandler;
  let importPort: jest.Mocked<IPlantSpeciesImportPort>;
  let writeRepository: jest.Mocked<IPlantSpeciesWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;

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
      save: jest
        .fn()
        .mockImplementation((aggregate) => Promise.resolve(aggregate)),
      delete: jest.fn(),
    } as jest.Mocked<IPlantSpeciesWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new ImportPlantSpeciesCommandHandler(
      importPort,
      writeRepository,
      new PlantSpeciesBuilder(),
      eventBus,
    );
  });

  it('returns correct imported count for new species from external source', async () => {
    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'Monstera deliciosa',
        description: 'Desc',
        imageUrl: 'https://example.com/img.jpg',
      },
      {
        scientificName: 'Ocimum basilicum',
        description: 'Basil',
        imageUrl: null,
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(null);

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(importPort.fetchPage).toHaveBeenCalledWith(10, 0);
    expect(result).toEqual({ imported: 2, skipped: 0, errors: 0 });
    expect(writeRepository.save).toHaveBeenCalledTimes(2);
  });

  it('creates species with scientificName only when enrichment fields are null', async () => {
    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'Rosa canina',
        description: null,
        imageUrl: null,
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(null);

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(result).toEqual({ imported: 1, skipped: 0, errors: 0 });
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scientificName: expect.objectContaining({ value: 'Rosa canina' }),
      }),
    );
  });

  it('skips existing species when no enrichment data is available', async () => {
    const existingAggregate = new PlantSpeciesBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withScientificName('Monstera deliciosa')
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'Monstera deliciosa',
        description: null,
        imageUrl: null,
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(existingAggregate);

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(result).toEqual({ imported: 0, skipped: 1, errors: 0 });
    expect(writeRepository.save).not.toHaveBeenCalled();
  });

  it('increments errors on save failure', async () => {
    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'Monstera deliciosa',
        description: 'Desc',
        imageUrl: null,
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(null);
    writeRepository.save.mockRejectedValue(new Error('DB error'));

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(result).toEqual({ imported: 0, skipped: 0, errors: 1 });
  });

  it('updates existing species when enrichment data is present', async () => {
    const existingAggregate = new PlantSpeciesBuilder()
      .withId('550e8400-e29b-41d4-a716-446655440000')
      .withScientificName('Monstera deliciosa')
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'Monstera deliciosa',
        description: 'Updated desc',
        imageUrl: null,
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(existingAggregate);

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(result.imported).toBe(1);
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        description: expect.objectContaining({ value: 'Updated desc' }),
      }),
    );
  });

  it('creates new species when not found by scientificName', async () => {
    importPort.fetchPage.mockResolvedValue([
      {
        scientificName: 'New Species',
        description: 'New desc',
        imageUrl: 'https://example.com/new.jpg',
      },
    ]);
    writeRepository.findByScientificName.mockResolvedValue(null);

    const result = await handler.execute(
      new ImportPlantSpeciesCommand({ limit: 10, offset: 0 }),
    );

    expect(result.imported).toBe(1);
    expect(writeRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        scientificName: expect.objectContaining({ value: 'New Species' }),
      }),
    );
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
  });
});
