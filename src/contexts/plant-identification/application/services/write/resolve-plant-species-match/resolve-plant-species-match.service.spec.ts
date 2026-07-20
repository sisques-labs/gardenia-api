import { ResolvePlantSpeciesMatchService } from './resolve-plant-species-match.service';

describe('ResolvePlantSpeciesMatchService', () => {
  const configService = { get: jest.fn().mockReturnValue(0.2) } as any;

  it('returns null when there is no top candidate', async () => {
    const plantSpeciesPort = { search: jest.fn() };
    const service = new ResolvePlantSpeciesMatchService(
      plantSpeciesPort,
      configService,
    );

    const result = await service.execute({ topCandidate: undefined });

    expect(result).toBeNull();
    expect(plantSpeciesPort.search).not.toHaveBeenCalled();
  });

  it('returns null when the top candidate is below the confidence threshold', async () => {
    const plantSpeciesPort = { search: jest.fn() };
    const service = new ResolvePlantSpeciesMatchService(
      plantSpeciesPort,
      configService,
    );

    const result = await service.execute({
      topCandidate: {
        scientificName: 'Unrecognizable plantus',
        commonNames: [],
        score: 0.05,
      },
    });

    expect(result).toBeNull();
    expect(plantSpeciesPort.search).not.toHaveBeenCalled();
  });

  it('returns null when no species match is found', async () => {
    const plantSpeciesPort = { search: jest.fn().mockResolvedValue([]) };
    const service = new ResolvePlantSpeciesMatchService(
      plantSpeciesPort,
      configService,
    );

    const result = await service.execute({
      topCandidate: {
        scientificName: 'Monstera deliciosa',
        commonNames: [],
        score: 0.9,
      },
    });

    expect(result).toBeNull();
  });

  it('resolves the top candidate against the species catalog', async () => {
    const plantSpeciesPort = {
      search: jest.fn().mockResolvedValue([
        {
          speciesKey: 2882337,
          scientificName: 'Monstera deliciosa',
          provider: 'gbif',
        },
      ]),
    };
    const service = new ResolvePlantSpeciesMatchService(
      plantSpeciesPort,
      configService,
    );

    const result = await service.execute({
      topCandidate: {
        scientificName: 'Monstera deliciosa',
        commonNames: [],
        score: 0.9,
      },
    });

    expect(plantSpeciesPort.search).toHaveBeenCalledWith(
      'Monstera deliciosa',
      1,
    );
    expect(result).toEqual({
      speciesKey: 2882337,
      scientificName: 'Monstera deliciosa',
      provider: 'gbif',
    });
  });
});
