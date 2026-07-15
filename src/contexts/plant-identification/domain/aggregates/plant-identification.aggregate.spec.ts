import {
  DateValueObject,
  NumberValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationConvertedToPlantEvent } from '@contexts/plant-identification/domain/events/plant-identification-converted-to-plant/plant-identification-converted-to-plant.event';
import { PlantIdentificationCreatedEvent } from '@contexts/plant-identification/domain/events/plant-identification-created/plant-identification-created.event';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationOrganValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-organ/plant-identification-organ.value-object';
import { PlantIdentificationScoreValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-score/plant-identification-score.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { PlantIdentificationAggregate } from './plant-identification.aggregate';

const ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const FILE_ID = '330e8400-e29b-41d4-a716-446655440004';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';

function buildIdentification(
  overrides: Partial<{
    resolvedGbifKey: NumberValueObject | null;
    resolvedScientificName: StringValueObject | null;
    convertedToPlantId: UuidValueObject | null;
    status: PlantIdentificationStatusEnum;
  }> = {},
): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(ID),
    requestedByUserId: new UuidValueObject(USER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    status: new PlantIdentificationStatusValueObject(
      overrides.status ?? PlantIdentificationStatusEnum.RESOLVED,
    ),
    resolvedGbifKey:
      overrides.resolvedGbifKey === undefined
        ? new NumberValueObject(2882337)
        : overrides.resolvedGbifKey,
    resolvedScientificName:
      overrides.resolvedScientificName === undefined
        ? new StringValueObject('Monstera deliciosa')
        : overrides.resolvedScientificName,
    convertedToPlantId: overrides.convertedToPlantId ?? null,
    photos: [
      {
        fileId: new UuidValueObject(FILE_ID),
        url: new StringValueObject('/api/files/330e8400/content'),
        organ: new PlantIdentificationOrganValueObject(
          PlantIdentificationOrganEnum.LEAF,
        ),
        position: new NumberValueObject(0),
      },
    ],
    candidates: [
      {
        scientificName: new StringValueObject('Monstera deliciosa'),
        commonNames: ['Swiss cheese plant'],
        score: new PlantIdentificationScoreValueObject(0.85),
        rank: new NumberValueObject(0),
      },
    ],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

describe('PlantIdentificationAggregate', () => {
  it('create() applies PlantIdentificationCreatedEvent', () => {
    const identification = buildIdentification();
    identification.create();
    const events = identification.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantIdentificationCreatedEvent);
  });

  it('convertToPlant() applies PlantIdentificationConvertedToPlantEvent and sets convertedToPlantId', () => {
    const identification = buildIdentification();
    identification.convertToPlant(PLANT_ID);

    expect(identification.convertedToPlantId?.value).toBe(PLANT_ID);
    const events = identification.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(PlantIdentificationConvertedToPlantEvent);
  });

  it('convertToPlant() throws when already converted', () => {
    const identification = buildIdentification({
      convertedToPlantId: new UuidValueObject(PLANT_ID),
    });

    expect(() => identification.convertToPlant(PLANT_ID)).toThrow(
      PlantIdentificationAlreadyConvertedException,
    );
  });

  it('toPrimitives() exposes all fields including nested photos/candidates', () => {
    const primitives = buildIdentification().toPrimitives();

    expect(primitives).toMatchObject({
      requestedByUserId: USER_ID,
      spaceId: SPACE_ID,
      status: PlantIdentificationStatusEnum.RESOLVED,
      resolvedGbifKey: 2882337,
      resolvedScientificName: 'Monstera deliciosa',
      convertedToPlantId: null,
    });
    expect(primitives.photos).toEqual([
      {
        fileId: FILE_ID,
        url: '/api/files/330e8400/content',
        organ: PlantIdentificationOrganEnum.LEAF,
        position: 0,
      },
    ]);
    expect(primitives.candidates).toEqual([
      {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Swiss cheese plant'],
        score: 0.85,
        rank: 0,
      },
    ]);
  });

  it('a no_match identification has null resolved fields', () => {
    const identification = buildIdentification({
      status: PlantIdentificationStatusEnum.NO_MATCH,
      resolvedGbifKey: null,
      resolvedScientificName: null,
    });

    const primitives = identification.toPrimitives();
    expect(primitives.status).toBe(PlantIdentificationStatusEnum.NO_MATCH);
    expect(primitives.resolvedGbifKey).toBeNull();
    expect(primitives.resolvedScientificName).toBeNull();
  });
});
