import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { QrFindByPlantIdQuery } from '@contexts/qr/application/queries/qr-find-by-plant-id/qr-find-by-plant-id.query';
import { QrViewModel } from '@contexts/qr/domain/view-models/qr.view-model';
import { PlantViewModel } from '@contexts/plants/domain/view-models/plant.view-model';

@Injectable()
export class EnrichPlantWithQrService {
  constructor(private readonly queryBus: QueryBus) {}

  async execute(plant: PlantViewModel): Promise<PlantViewModel> {
    const qr = await this.queryBus.execute<
      QrFindByPlantIdQuery,
      QrViewModel | null
    >(new QrFindByPlantIdQuery({ plantId: plant.id }));

    if (!qr) {
      return plant;
    }

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
