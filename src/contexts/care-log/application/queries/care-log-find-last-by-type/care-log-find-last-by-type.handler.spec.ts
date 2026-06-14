import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { ICareLogEntryReadRepository } from '@contexts/care-log/domain/repositories/read/care-log-entry-read.repository';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogFindLastByTypeQuery } from './care-log-find-last-by-type.query';
import { CareLogFindLastByTypeQueryHandler } from './care-log-find-last-by-type.handler';

const ENTRY_ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const NOW = new Date('2024-01-01T00:00:00.000Z');

const buildViewModel = (): CareLogEntryViewModel =>
  new CareLogEntryViewModel({
    id: ENTRY_ID,
    plantId: PLANT_ID,
    userId: USER_ID,
    spaceId: SPACE_ID,
    activityType: CareLogActivityTypeEnum.WATERING,
    performedAt: NOW,
    notes: null,
    quantity: null,
    unit: null,
    createdAt: NOW,
    updatedAt: NOW,
  });

describe('CareLogFindLastByTypeQueryHandler', () => {
  let handler: CareLogFindLastByTypeQueryHandler;
  let readRepository: jest.Mocked<ICareLogEntryReadRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    readRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      findLastByType: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ICareLogEntryReadRepository>;

    handler = new CareLogFindLastByTypeQueryHandler(readRepository);
  });

  it('should return a view model when an entry is found', async () => {
    const vm = buildViewModel();
    readRepository.findLastByType.mockResolvedValue(vm);

    const query = new CareLogFindLastByTypeQuery({
      plantId: PLANT_ID,
      activityType: CareLogActivityTypeEnum.WATERING,
    });

    const result = await handler.execute(query);

    expect(result).toBe(vm);
    expect(readRepository.findLastByType).toHaveBeenCalledWith(
      PLANT_ID,
      CareLogActivityTypeEnum.WATERING,
    );
  });

  it('should return null when no entry is found', async () => {
    readRepository.findLastByType.mockResolvedValue(null);

    const query = new CareLogFindLastByTypeQuery({
      plantId: PLANT_ID,
      activityType: CareLogActivityTypeEnum.WATERING,
    });

    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
