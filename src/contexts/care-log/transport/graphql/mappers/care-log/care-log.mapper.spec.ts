import { CareLogActivityTypeEnum } from '@contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '@contexts/care-log/domain/enums/care-log-unit.enum';
import { CareLogEntryViewModel } from '@contexts/care-log/domain/view-models/care-log-entry.view-model';
import { CareLogGraphQLMapper } from './care-log.mapper';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const PLANT_ID = '110e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const NOW = new Date('2026-01-01T00:00:00.000Z');

const buildViewModel = (
  overrides: Partial<CareLogEntryViewModel> = {},
): CareLogEntryViewModel =>
  new CareLogEntryViewModel({
    id: ID,
    plantId: PLANT_ID,
    userId: USER_ID,
    spaceId: SPACE_ID,
    activityType: CareLogActivityTypeEnum.WATERING,
    performedAt: NOW,
    notes: 'note',
    quantity: 500,
    unit: CareLogUnitEnum.ML,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  });

describe('CareLogGraphQLMapper', () => {
  let mapper: CareLogGraphQLMapper;

  beforeEach(() => {
    mapper = new CareLogGraphQLMapper();
  });

  it('maps every field from the view model', () => {
    const dto = mapper.toResponseDto(buildViewModel());

    expect(dto.id).toBe(ID);
    expect(dto.plantId).toBe(PLANT_ID);
    expect(dto.activityType).toBe(CareLogActivityTypeEnum.WATERING);
    expect(dto.notes).toBe('note');
    expect(dto.quantity).toBe(500);
    expect(dto.unit).toBe(CareLogUnitEnum.ML);
  });

  it('maps null optional fields', () => {
    const dto = mapper.toResponseDto(
      buildViewModel({ notes: null, quantity: null, unit: null }),
    );

    expect(dto.notes).toBeNull();
    expect(dto.quantity).toBeNull();
    expect(dto.unit).toBeNull();
  });
});
