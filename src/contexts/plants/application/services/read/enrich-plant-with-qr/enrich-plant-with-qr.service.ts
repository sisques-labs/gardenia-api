import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';
import { QrFindByIdQuery } from '@contexts/qr/application/queries/qr-find-by-id/qr-find-by-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { Injectable, Logger } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

@Injectable()
export class EnrichPlantWithQrService {
  private readonly logger = new Logger(EnrichPlantWithQrService.name);

  constructor(private readonly queryBus: QueryBus) {}

  async execute(plant: PlantViewModel): Promise<PlantViewModel> {
    this.logger.log(`Enriching plant ${plant.id} with QR`);

    if (!plant.qrId) {
      this.logger.warn(`Plant ${plant.id} has no QR`);
      return plant;
    }

    const qr = await this.queryBus.execute<QrFindByIdQuery, QrViewModel>(
      new QrFindByIdQuery({ qrId: plant.qrId }),
    );

    this.logger.debug(`QR ${qr.id} found for plant ${plant.id}`);

    return new PlantViewModel({
      id: plant.id,
      name: plant.name,
      species: plant.species,
      imageUrl: plant.imageUrl,
      userId: plant.userId,
      spaceId: plant.spaceId,
      qrId: qr.id,
      targetUrl: qr.targetUrl,
      createdAt: plant.createdAt,
      updatedAt: plant.updatedAt,
    });
  }
}
