import { QueryBus } from '@nestjs/cqrs';

import { CareLogFindLastByTypeQuery } from '@contexts/care-log/application/queries/care-log-find-last-by-type/care-log-find-last-by-type.query';
import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';

import { CareLogAdapter } from './care-log.adapter';

const PLANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const NOW = new Date('2024-06-01T10:00:00.000Z');
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440003';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';

function buildVm(activityType: CareLogActivityTypeEnum, performedAt: Date): CareLogEntryViewModel {
  return new CareLogEntryViewModel({
    id: '550e8400-e29b-41d4-a716-446655440000',
    plantId: PLANT_ID,
    userId: USER_ID,
    spaceId: SPACE_ID,
    activityType,
    performedAt,
    notes: null,
    quantity: null,
    unit: null,
    createdAt: performedAt,
    updatedAt: performedAt,
  });
}

describe('CareLogAdapter', () => {
  let adapter: CareLogAdapter;
  let queryBus: jest.Mocked<QueryBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    queryBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<QueryBus>;

    adapter = new CareLogAdapter(queryBus);
  });

  describe('getCareLogSummary()', () => {
    it('should dispatch 9 queries in parallel and return correct CareLogSummary shape', async () => {
      queryBus.execute.mockImplementation(async (query) => {
        const q = query as CareLogFindLastByTypeQuery;
        if (q.activityType.value === CareLogActivityTypeEnum.WATERING) {
          return buildVm(CareLogActivityTypeEnum.WATERING, NOW);
        }
        return null;
      });

      const summary = await adapter.getCareLogSummary(PLANT_ID);

      expect(queryBus.execute).toHaveBeenCalledTimes(9);

      expect(summary.lastWateredAt).toEqual(NOW);
      expect(summary.lastFertilizedAt).toBeNull();
      expect(summary.lastPrunedAt).toBeNull();
      expect(summary.lastRepottedAt).toBeNull();
      expect(summary.lastTransplantedAt).toBeNull();
      expect(summary.lastPestTreatmentAt).toBeNull();
      expect(summary.lastMistedAt).toBeNull();
      expect(summary.lastRotatedAt).toBeNull();
      expect(summary.lastOtherAt).toBeNull();
    });

    it('should return null dates for all types when no entries exist', async () => {
      queryBus.execute.mockResolvedValue(null);

      const summary = await adapter.getCareLogSummary(PLANT_ID);

      expect(queryBus.execute).toHaveBeenCalledTimes(9);

      expect(summary.lastWateredAt).toBeNull();
      expect(summary.lastFertilizedAt).toBeNull();
      expect(summary.lastPrunedAt).toBeNull();
      expect(summary.lastRepottedAt).toBeNull();
      expect(summary.lastTransplantedAt).toBeNull();
      expect(summary.lastPestTreatmentAt).toBeNull();
      expect(summary.lastMistedAt).toBeNull();
      expect(summary.lastRotatedAt).toBeNull();
      expect(summary.lastOtherAt).toBeNull();
    });
  });
});
