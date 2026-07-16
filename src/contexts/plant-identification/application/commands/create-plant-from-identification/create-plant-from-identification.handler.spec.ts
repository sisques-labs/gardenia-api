import { EventBus } from '@nestjs/cqrs';
import {
  DateValueObject,
  StringValueObject,
  UuidValueObject,
} from '@sisques-labs/nestjs-kit';

import { IPlantsPort } from '@contexts/plant-identification/application/ports/plants.port';
import { AssertPlantIdentificationExistsService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-exists/assert-plant-identification-exists.service';
import { AssertPlantIdentificationOwnershipService } from '@contexts/plant-identification/application/services/write/assert-plant-identification-ownership/assert-plant-identification-ownership.service';
import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import { PlantIdentificationAlreadyConvertedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-already-converted.exception';
import { PlantIdentificationForbiddenException } from '@contexts/plant-identification/domain/exceptions/plant-identification-forbidden.exception';
import { PlantIdentificationNotFoundException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-found.exception';
import { PlantIdentificationNotResolvedException } from '@contexts/plant-identification/domain/exceptions/plant-identification-not-resolved.exception';
import { IPlantIdentificationWriteRepository } from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';
import { PlantIdentificationIdValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-id/plant-identification-id.value-object';
import { PlantIdentificationSpeciesKeyValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-key/plant-identification-species-key.value-object';
import { PlantIdentificationSpeciesProviderValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-species-provider/plant-identification-species-provider.value-object';
import { PlantIdentificationStatusValueObject } from '@contexts/plant-identification/domain/value-objects/plant-identification-status/plant-identification-status.value-object';
import { CreatePlantFromIdentificationCommand } from './create-plant-from-identification.command';
import { CreatePlantFromIdentificationCommandHandler } from './create-plant-from-identification.handler';

const IDENTIFICATION_ID = '550e8400-e29b-41d4-a716-446655440000';
const OWNER_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_USER_ID = '660e8400-e29b-41d4-a716-446655440099';
const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const PLANT_ID = '440e8400-e29b-41d4-a716-446655440003';

function buildIdentification(
  resolved = true,
  convertedToPlantId: string | null = null,
): PlantIdentificationAggregate {
  return new PlantIdentificationAggregate({
    id: new PlantIdentificationIdValueObject(IDENTIFICATION_ID),
    requestedByUserId: new UuidValueObject(OWNER_ID),
    spaceId: new UuidValueObject(SPACE_ID),
    status: new PlantIdentificationStatusValueObject(
      resolved
        ? PlantIdentificationStatusEnum.RESOLVED
        : PlantIdentificationStatusEnum.NO_MATCH,
    ),
    resolvedSpeciesKey: resolved
      ? new PlantIdentificationSpeciesKeyValueObject(2882337)
      : null,
    resolvedScientificName: resolved
      ? new StringValueObject('Monstera deliciosa')
      : null,
    resolvedSpeciesProvider: resolved
      ? new PlantIdentificationSpeciesProviderValueObject('gbif')
      : null,
    convertedToPlantId: convertedToPlantId
      ? new UuidValueObject(convertedToPlantId)
      : null,
    photos: [],
    candidates: [],
    createdAt: new DateValueObject(new Date()),
    updatedAt: new DateValueObject(new Date()),
  });
}

function buildCommand(
  requestingUserId = OWNER_ID,
): CreatePlantFromIdentificationCommand {
  return new CreatePlantFromIdentificationCommand({
    identificationId: IDENTIFICATION_ID,
    name: 'My Monstera',
    requestingUserId,
  });
}

describe('CreatePlantFromIdentificationCommandHandler', () => {
  let handler: CreatePlantFromIdentificationCommandHandler;
  let mockWriteRepo: jest.Mocked<IPlantIdentificationWriteRepository>;
  let mockPlantsPort: jest.Mocked<IPlantsPort>;
  let assertExistsService: AssertPlantIdentificationExistsService;
  let assertOwnershipService: AssertPlantIdentificationOwnershipService;
  let mockEventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    mockWriteRepo = {
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      delete: jest.fn(),
    };

    mockPlantsPort = {
      createPlant: jest.fn().mockResolvedValue({ id: PLANT_ID }),
    };

    assertExistsService = new AssertPlantIdentificationExistsService(
      mockWriteRepo,
    );
    assertOwnershipService = new AssertPlantIdentificationOwnershipService();

    mockEventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    handler = new CreatePlantFromIdentificationCommandHandler(
      mockWriteRepo,
      mockPlantsPort,
      assertExistsService,
      assertOwnershipService,
      mockEventBus,
    );
  });

  it('creates a plant via IPlantsPort and stamps convertedToPlantId', async () => {
    mockWriteRepo.findById.mockResolvedValue(buildIdentification(true));

    const result = await handler.execute(buildCommand());

    expect(mockPlantsPort.createPlant).toHaveBeenCalledWith({
      name: 'My Monstera',
      gbifSpeciesKey: 2882337,
      speciesScientificName: 'Monstera deliciosa',
      imageUrl: null,
      userId: OWNER_ID,
    });
    expect(mockWriteRepo.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: PLANT_ID });
  });

  it('throws 404 when the identification does not exist', async () => {
    mockWriteRepo.findById.mockResolvedValue(null);

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      PlantIdentificationNotFoundException,
    );
    expect(mockPlantsPort.createPlant).not.toHaveBeenCalled();
  });

  it('throws 403 when the requesting user is not the owner', async () => {
    mockWriteRepo.findById.mockResolvedValue(buildIdentification(true));

    await expect(handler.execute(buildCommand(OTHER_USER_ID))).rejects.toThrow(
      PlantIdentificationForbiddenException,
    );
    expect(mockPlantsPort.createPlant).not.toHaveBeenCalled();
  });

  it('throws 409 when the identification is not resolved', async () => {
    mockWriteRepo.findById.mockResolvedValue(buildIdentification(false));

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      PlantIdentificationNotResolvedException,
    );
    expect(mockPlantsPort.createPlant).not.toHaveBeenCalled();
  });

  it('throws 409 when already converted, WITHOUT calling IPlantsPort again (no duplicate plant on retry)', async () => {
    mockWriteRepo.findById.mockResolvedValue(
      buildIdentification(true, PLANT_ID),
    );

    await expect(handler.execute(buildCommand())).rejects.toThrow(
      PlantIdentificationAlreadyConvertedException,
    );
    expect(mockPlantsPort.createPlant).not.toHaveBeenCalled();
  });
});
