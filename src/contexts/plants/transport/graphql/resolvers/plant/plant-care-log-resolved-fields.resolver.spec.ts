import { ICareLogPort } from '@contexts/plants/application/ports/care-log.port';
import { PlantResponseDto } from '../../dtos/responses/plant/plant.response.dto';
import { PlantCareLogResolvedFieldsResolver } from './plant-care-log-resolved-fields.resolver';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('PlantCareLogResolvedFieldsResolver', () => {
  let sut: PlantCareLogResolvedFieldsResolver;
  let careLogPort: jest.Mocked<ICareLogPort>;

  beforeEach(() => {
    careLogPort = {
      getCareLogSummary: jest.fn(),
    } as unknown as jest.Mocked<ICareLogPort>;
    sut = new PlantCareLogResolvedFieldsResolver(careLogPort);
  });

  it('returns the summary when at least one field is set', async () => {
    const summary = { lastWateredAt: new Date(), lastFertilizedAt: null };
    careLogPort.getCareLogSummary.mockResolvedValue(summary as never);

    const result = await sut.careLog({ id: PLANT_ID } as PlantResponseDto);

    expect(careLogPort.getCareLogSummary).toHaveBeenCalledWith(PLANT_ID);
    expect(result).toBe(summary);
  });

  it('returns null when every summary field is null', async () => {
    careLogPort.getCareLogSummary.mockResolvedValue({
      lastWateredAt: null,
      lastFertilizedAt: null,
    } as never);

    const result = await sut.careLog({ id: PLANT_ID } as PlantResponseDto);

    expect(result).toBeNull();
  });
});
