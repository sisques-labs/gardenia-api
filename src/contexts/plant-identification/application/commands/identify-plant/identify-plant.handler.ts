import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { IdentifyPlantResolvedResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant-resolved.result';
import { IdentifyPlantCommand } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.command';
import { IdentifyPlantResult } from '@contexts/plant-identification/application/commands/identify-plant/identify-plant.result';
import {
  FILES_PORT,
  IFilesPort,
} from '@contexts/plant-identification/application/ports/files.port';
import {
  IPlantNetIdentificationPort,
  PLANTNET_IDENTIFICATION_PORT,
} from '@contexts/plant-identification/application/ports/plantnet-identification.port';
import {
  IPlantSpeciesPort,
  PLANT_SPECIES_PORT,
} from '@contexts/plant-identification/application/ports/plant-species.port';
import { PlantIdentificationAggregate } from '@contexts/plant-identification/domain/aggregates/plant-identification.aggregate';
import { PlantIdentificationBuilder } from '@contexts/plant-identification/domain/builders/plant-identification.builder';
import { PlantIdentificationOrganEnum } from '@contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { PlantIdentificationStatusEnum } from '@contexts/plant-identification/domain/enums/plant-identification-status.enum';
import {
  IPlantIdentificationWriteRepository,
  PLANT_IDENTIFICATION_WRITE_REPOSITORY,
} from '@contexts/plant-identification/domain/repositories/write/plant-identification-write.repository';

/** Mirrors `PLANTNET_MIN_CONFIDENCE`'s documented default in `.env.example`. */
const DEFAULT_MIN_CONFIDENCE = 0.2;

@CommandHandler(IdentifyPlantCommand)
export class IdentifyPlantCommandHandler
  extends BaseCommandHandler<IdentifyPlantCommand, PlantIdentificationAggregate>
  implements ICommandHandler<IdentifyPlantCommand, IdentifyPlantResult>
{
  private readonly logger = new Logger(IdentifyPlantCommandHandler.name);
  private readonly minConfidence: number;

  constructor(
    @Inject(PLANT_IDENTIFICATION_WRITE_REPOSITORY)
    private readonly plantIdentificationWriteRepository: IPlantIdentificationWriteRepository,
    @Inject(FILES_PORT)
    private readonly filesPort: IFilesPort,
    @Inject(PLANTNET_IDENTIFICATION_PORT)
    private readonly plantNetIdentificationPort: IPlantNetIdentificationPort,
    @Inject(PLANT_SPECIES_PORT)
    private readonly plantSpeciesPort: IPlantSpeciesPort,
    private readonly plantIdentificationBuilder: PlantIdentificationBuilder,
    configService: ConfigService,
    eventBus: EventBus,
  ) {
    super(eventBus);
    this.minConfidence = configService.get<number>(
      'plantnet.minConfidence',
      DEFAULT_MIN_CONFIDENCE,
    );
  }

  async execute(command: IdentifyPlantCommand): Promise<IdentifyPlantResult> {
    const now = new Date();
    const identificationId = UuidValueObject.generate().value;

    // 1. Upload every photo via `files`. No ordering dependency between
    // uploads — run in parallel. Uploaded files are NOT rolled back if the
    // PlantNet call below fails (see design.md's "photos are uploaded (and
    // kept) even on provider failure" decision).
    const uploadedPhotos = await Promise.all(
      command.photos.map((photo) =>
        this.filesPort.uploadFile({
          filename: photo.filename,
          mimeType: photo.mimeType,
          size: photo.size,
          content: photo.content,
          userId: command.userId,
          spaceId: command.spaceId,
        }),
      ),
    );

    // 2. Send every photo in ONE PlantNet request (never one request per
    // photo — PlantNet uses the extra images/organs to improve one scored
    // result). On failure, log and rethrow — nothing is persisted.
    this.logger.log(
      `Calling PlantNet identification with ${command.photos.length} photo(s) for user: ${command.userId.value}`,
    );

    let candidates: Awaited<
      ReturnType<IPlantNetIdentificationPort['identify']>
    >;
    try {
      candidates = await this.plantNetIdentificationPort.identify(
        command.photos.map((photo) => ({
          content: photo.content,
          mimeType: photo.mimeType.value,
          organ: photo.organ.value as PlantIdentificationOrganEnum,
        })),
        command.project?.value,
      );
    } catch (error) {
      this.logger.error(
        `PlantNet identification failed for user ${command.userId.value}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }

    // 3. Auto-resolve the top candidate against GBIF when confident enough.
    let resolved: IdentifyPlantResolvedResult | null = null;
    const topCandidate = candidates[0];
    if (topCandidate && topCandidate.score >= this.minConfidence) {
      const matches = await this.plantSpeciesPort.search(
        topCandidate.scientificName,
        1,
      );
      const bestMatch = matches[0];
      if (bestMatch) {
        resolved = {
          gbifKey: bestMatch.gbifKey,
          scientificName: bestMatch.scientificName,
        };
      }
    }

    const status = resolved
      ? PlantIdentificationStatusEnum.RESOLVED
      : PlantIdentificationStatusEnum.NO_MATCH;

    // 4. Build + persist the aggregate with the full result.
    const identification = this.plantIdentificationBuilder
      .withId(identificationId)
      .withRequestedByUserId(command.userId.value)
      .withSpaceId(command.spaceId.value)
      .withStatus(status)
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

    this.logger.log(
      `Plant identification ${status}: ${identificationId} by user: ${command.userId.value}`,
    );

    const primitives = identification.toPrimitives();
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
