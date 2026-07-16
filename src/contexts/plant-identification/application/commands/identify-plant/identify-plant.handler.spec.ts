import { EventBus } from '@nestjs/cqrs';

import { IdentifyPlantPhotosService } from '@contexts/plant-identification/application/services/write/identify-plant-photos/identify-plant-photos.service';
import { ResolvePlantSpeciesMatchService } from '@contexts/plant-identification/application/services/write/resolve-plant-species-match/resolve-plant-species-match.service';
import { UploadIdentificationPhotosService } from '@contexts/plant-identification/application/services/write/upload-identification-photos/upload-identification-photos.service';
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
  let mockUploadService: jest.Mocked<UploadIdentificationPhotosService>;
  let mockIdentifyService: jest.Mocked<IdentifyPlantPhotosService>;
  let mockResolveService: jest.Mocked<ResolvePlantSpeciesMatchService>;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    };

    mockUploadService = {
      execute: jest.fn().mockResolvedValue([{ id: FILE_ID, url: FILE_URL }]),
    } as unknown as jest.Mocked<UploadIdentificationPhotosService>;

    mockIdentifyService = {
      execute: jest.fn().mockResolvedValue([
        {
          scientificName: 'Monstera deliciosa',
          commonNames: ['Monstera'],
          score: 0.85,
        },
        { scientificName: 'Monstera adansonii', commonNames: [], score: 0.1 },
      ]),
    } as unknown as jest.Mocked<IdentifyPlantPhotosService>;

    mockResolveService = {
      execute: jest.fn().mockResolvedValue({
        speciesKey: 2882337,
        scientificName: 'Monstera deliciosa',
        provider: 'gbif',
      }),
    } as unknown as jest.Mocked<ResolvePlantSpeciesMatchService>;

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new IdentifyPlantCommandHandler(
      mockWriteRepo,
      mockUploadService,
      mockIdentifyService,
      mockResolveService,
      new PlantIdentificationBuilder(),
      mockEventBus,
    );
  });

  it('uploads photos, identifies once, resolves against the species catalog, and persists', async () => {
    const result = await handler.execute(buildCommand());

    expect(mockUploadService.execute).toHaveBeenCalledTimes(1);
    expect(mockIdentifyService.execute).toHaveBeenCalledTimes(1);
    expect(mockResolveService.execute).toHaveBeenCalledWith({
      topCandidate: {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Monstera'],
        score: 0.85,
      },
    });
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

  it('sends all photos to the identify service in a single call (multi-photo)', async () => {
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
    mockUploadService.execute.mockResolvedValue([
      { id: '330e8400-e29b-41d4-a716-446655440010', url: '/api/files/1' },
      { id: '330e8400-e29b-41d4-a716-446655440011', url: '/api/files/2' },
    ]);

    await handler.execute(command);

    expect(mockIdentifyService.execute).toHaveBeenCalledTimes(1);
    expect(mockIdentifyService.execute.mock.calls[0][0].photos).toHaveLength(2);
  });

  it('stays no_match when resolution does not find a match', async () => {
    mockIdentifyService.execute.mockResolvedValue([
      { scientificName: 'Some Plant', commonNames: [], score: 0.05 },
    ]);
    mockResolveService.execute.mockResolvedValue(null);

    const result = await handler.execute(buildCommand());

    expect(result.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(result.resolved).toBeNull();
  });

  it('stays no_match with an empty candidate list', async () => {
    mockIdentifyService.execute.mockResolvedValue([]);
    mockResolveService.execute.mockResolvedValue(null);

    const result = await handler.execute(buildCommand());

    expect(result.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(result.candidates).toEqual([]);
  });

  it('propagates an identification failure and does not persist anything', async () => {
    mockIdentifyService.execute.mockRejectedValue(new Error('provider down'));

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      'provider down',
    );

    expect(mockWriteRepo.save).not.toHaveBeenCalled();
  });

  it('still uploads photos even when identification fails afterwards', async () => {
    mockIdentifyService.execute.mockRejectedValue(new Error('provider down'));

    await expect(handler.execute(buildCommand())).rejects.toThrow();

    expect(mockUploadService.execute).toHaveBeenCalledTimes(1);
  });
});
