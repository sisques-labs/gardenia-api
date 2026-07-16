import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

import { IFilesPort } from '@contexts/plant-identification/application/ports/files.port';
import { IPlantNetIdentificationPort } from '@contexts/plant-identification/application/ports/plantnet-identification.port';
import { IPlantSpeciesPort } from '@contexts/plant-identification/application/ports/plant-species.port';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { IPlantIdentificationWriteRepository } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { IdentifyPlantCommand } from './identify-plant.command';
import { IdentifyPlantCommandHandler } from './identify-plant.handler';

const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const FILE_URL = '/api/files/330e8400/content';

function buildCommand(): IdentifyPlantCommand {
  return new IdentifyPlantCommand({
    photos: [
      {
        filename: 'leaf.png',
        mimeType: 'image/png',
        size: 1024,
        content: Buffer.from('leaf-bytes'),
        organ: PlantIdentificationOrganEnum.LEAF,
      },
    ],
    userId: USER_ID,
    spaceId: SPACE_ID,
  });
}

describe('IdentifyPlantCommandHandler', () => {
  let handler: IdentifyPlantCommandHandler;
  let mockWriteRepo: jest.Mocked<IPlantIdentificationWriteRepository>;
  let mockFilesPort: jest.Mocked<IFilesPort>;
  let mockPlantNetPort: jest.Mocked<IPlantNetIdentificationPort>;
  let mockPlantSpeciesPort: jest.Mocked<IPlantSpeciesPort>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    };

    mockFilesPort = {
      uploadFile: jest.fn().mockResolvedValue({ id: FILE_ID, url: FILE_URL }),
    };

    mockPlantNetPort = {
      identify: jest.fn().mockResolvedValue([
        {
          scientificName: 'Monstera deliciosa',
          commonNames: ['Monstera'],
          score: 0.85,
        },
        { scientificName: 'Monstera adansonii', commonNames: [], score: 0.1 },
      ]),
    };

    mockPlantSpeciesPort = {
      search: jest.fn().mockResolvedValue([
        {
          speciesKey: 2882337,
          scientificName: 'Monstera deliciosa',
          provider: 'gbif',
        },
      ]),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(0.2),
    } as unknown as jest.Mocked<ConfigService>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new IdentifyPlantCommandHandler(
      mockWriteRepo,
      mockFilesPort,
      mockPlantNetPort,
      mockPlantSpeciesPort,
      new PlantIdentificationBuilder(),
      mockConfigService,
      mockEventBus,
    );
  });

  it('uploads photos, calls PlantNet once, resolves against GBIF, and persists', async () => {
    const result = await handler.execute(buildCommand());

    expect(mockFilesPort.uploadFile).toHaveBeenCalledTimes(1);
    expect(mockPlantNetPort.identify).toHaveBeenCalledTimes(1);
    expect(mockPlantSpeciesPort.search).toHaveBeenCalledWith(
      'Monstera deliciosa',
      1,
    );
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);

    expect(result.status).toBe(PlantIdentificationStatusEnum.RESOLVED);
    expect(result.resolved).toEqual({
      speciesKey: 2882337,
      scientificName: 'Monstera deliciosa',
      provider: 'gbif',
    });
    expect(result.candidates).toHaveLength(2);
    expect(result.photos).toEqual([
      {
        fileId: FILE_ID,
        url: FILE_URL,
        organ: PlantIdentificationOrganEnum.LEAF,
        position: 0,
      },
    ]);
  });

  it('sends all photos in a single PlantNet request (multi-photo)', async () => {
    const command = new IdentifyPlantCommand({
      photos: [
        {
          filename: 'leaf.png',
          mimeType: 'image/png',
          size: 1024,
          content: Buffer.from('leaf'),
          organ: PlantIdentificationOrganEnum.LEAF,
        },
        {
          filename: 'flower.png',
          mimeType: 'image/png',
          size: 2048,
          content: Buffer.from('flower'),
          organ: PlantIdentificationOrganEnum.FLOWER,
        },
      ],
      userId: USER_ID,
      spaceId: SPACE_ID,
    });
    mockFilesPort.uploadFile
      .mockResolvedValueOnce({
        id: '330e8400-e29b-41d4-a716-446655440010',
        url: '/api/files/1',
      })
      .mockResolvedValueOnce({
        id: '330e8400-e29b-41d4-a716-446655440011',
        url: '/api/files/2',
      });

    await handler.execute(command);

    expect(mockPlantNetPort.identify).toHaveBeenCalledTimes(1);
    expect(mockPlantNetPort.identify.mock.calls[0][0]).toHaveLength(2);
  });

  it('stays no_match when the top candidate is below the confidence threshold', async () => {
    mockPlantNetPort.identify.mockResolvedValue([
      { scientificName: 'Some Plant', commonNames: [], score: 0.05 },
    ]);

    const result = await handler.execute(buildCommand());

    expect(result.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(result.resolved).toBeNull();
    expect(mockPlantSpeciesPort.search).not.toHaveBeenCalled();
  });

  it('stays no_match when GBIF finds no match for a confident top candidate', async () => {
    mockPlantSpeciesPort.search.mockResolvedValue([]);

    const result = await handler.execute(buildCommand());

    expect(result.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(result.resolved).toBeNull();
  });

  it('stays no_match with an empty candidate list', async () => {
    mockPlantNetPort.identify.mockResolvedValue([]);

    const result = await handler.execute(buildCommand());

    expect(result.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(result.candidates).toEqual([]);
  });

  it('propagates a PlantNet failure and does not persist anything', async () => {
    mockPlantNetPort.identify.mockRejectedValue(new Error('PlantNet down'));

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      'PlantNet down',
    );

    expect(mockWriteRepo.save).not.toHaveBeenCalled();
  });

  it('still uploads photos even when the PlantNet call fails afterwards', async () => {
    mockPlantNetPort.identify.mockRejectedValue(new Error('PlantNet down'));

    await expect(handler.execute(buildCommand())).rejects.toThrow();

    expect(mockFilesPort.uploadFile).toHaveBeenCalledTimes(1);
  });
});
