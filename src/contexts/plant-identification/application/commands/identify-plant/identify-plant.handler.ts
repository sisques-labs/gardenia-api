import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IdentifyPlantResolvedResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-resolved.result';
import { IdentifyPlantCommand } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.command';
import { IdentifyPlantResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.result';
import { IdentifyPlantPhotosService } from '@contexts/plant-identification/application/services/write/identify-plant-photos/identify-plant-photos.service';
import { ResolvePlantSpeciesMatchService } from '@contexts/plant-identification/application/services/write/resolve-plant-species-match/resolve-plant-species-match.service';
import { UploadIdentificationPhotosService } from '@contexts/plant-identification/application/services/write/upload-identification-photos/upload-identification-photos.service';
import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import {
  IPlantIdentificationWriteRepository,
  PLANT_IDENTIFICATION_WRITE_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';

@CommandHandler(IdentifyPlantCommand)
export class IdentifyPlantCommandHandler
  extends BaseCommandHandler<IdentifyPlantCommand, PlantIdentificationAggregate>
  implements ICommandHandler<IdentifyPlantCommand, IdentifyPlantResult>
{
  private readonly logger = new Logger(IdentifyPlantCommandHandler.name);

  constructor(
    @Inject(PLANT_IDENTIFICATION_WRITE_REPOSITORY)
    private readonly plantIdentificationWriteRepository: IPlantIdentificationWriteRepository,
    private readonly uploadIdentificationPhotosService: UploadIdentificationPhotosService,
    private readonly identifyPlantPhotosService: IdentifyPlantPhotosService,
    private readonly resolvePlantSpeciesMatchService: ResolvePlantSpeciesMatchService,
    private readonly plantIdentificationBuilder: PlantIdentificationBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: IdentifyPlantCommand): Promise<IdentifyPlantResult> {
    const now = new Date();
    const identificationId = UuidValueObject.generate().value;

    // Upload every photo via `files`, AND identify the plant from all of
    // them, concurrently — these two calls have no data dependency on each
    // other. Uploaded files are NOT rolled back if identification fails
    // (see design.md's "photos are uploaded (and kept) even on provider
    // failure" decision). `allSettled` (not `all`) so that, when identify
    // rejects, we still wait for the upload write to finish before this
    // command returns/throws — otherwise the upload keeps writing after the
    // request completes, which under test can race a subsequent test's
    // table truncation into a deadlock.
    const [uploadOutcome, identifyOutcome] = await Promise.allSettled([
      this.uploadIdentificationPhotosService.execute({
        photos: command.photos,
        userId: command.userId,
        spaceId: command.spaceId,
      }),
      this.identifyPlantPhotosService.execute({
        photos: command.photos,
        project: command.project,
        userId: command.userId,
      }),
    ]);

    if (uploadOutcome.status === 'rejected') throw uploadOutcome.reason;
    if (identifyOutcome.status === 'rejected') throw identifyOutcome.reason;

    const uploadedPhotos = uploadOutcome.value;
    const candidates = identifyOutcome.value;

    const resolved: IdentifyPlantResolvedResult | null =
      await this.resolvePlantSpeciesMatchService.execute({
        topCandidate: candidates[0],
      });

    // Build + persist the aggregate with the full result. `status` is
    // derived by the builder from whether `resolved` is set — not decided
    // here (see `PlantIdentificationBuilder.withResolved()`).
    const identification = this.plantIdentificationBuilder
      .withId(identificationId)
      .withRequestedByUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withResolved(resolved)
      .withPhotos(
        uploadedPhotos.map((uploaded, index) => ({
          fileId: uploaded.id,
          url: uploaded.url,
          organ: command.photos[index].organ
            .value as PlantIdentificationOrganEnum,
          position: index,
        })),
      )
      .withCandidates(
        candidates.map((candidate, index) => ({
          scientificName: candidate.scientificName,
          commonNames: candidate.commonNames,
          score: candidate.score,
          rank: index,
        })),
      )
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    identification.create();

    await this.plantIdentificationWriteRepository.save(identification);
    await this.publishEvents(identification);

    const primitives = identification.toPrimitives();

    this.logger.log(
      `Plant identification ${primitives.status}: ${identificationId} by user: ${command.userId.value}`,
    );

    return {
      id: primitives.id,
      status: primitives.status,
      resolved,
      candidates: primitives.candidates,
      photos: primitives.photos,
      createdAt: primitives.createdAt,
    };
  }
}
