import { IPlantPrimitives } from '@contexts/plants/domain/primitives/plant.primitives';
import { PlantPlantingSpotViewModel } from '@contexts/plants/domain/view-models/plant-planting-spot.view-model';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';
import { PlantSpeciesViewModel } from '@contexts/plants/domain/view-models/plant-species.view-model';
import { BaseViewModel } from '@sisques-labs/nestjs-kit';

export class PlantViewModel extends BaseViewModel {
  public readonly name: string;
  public readonly plantSpeciesId: string | null;
  public readonly species: PlantSpeciesViewModel | null;
  public readonly imageUrl: string | null;
  public readonly userId: string;
  public readonly spaceId: string;
  public readonly qrId: string | null;
  public readonly qr: PlantQrViewModel | null;
  public readonly plantingSpotId: string | null;
  public readonly plantingSpot: PlantPlantingSpotViewModel | null;

  constructor(
    props: IPlantPrimitives & {
      species?: PlantSpeciesViewModel | null;
      qr?: PlantQrViewModel | null;
      plantingSpot?: PlantPlantingSpotViewModel | null;
    },
  ) {
    super(props.id, props.createdAt, props.updatedAt);
    this.name = props.name;
    this.plantSpeciesId = props.plantSpeciesId;
    this.species = props.species ?? null;
    this.imageUrl = props.imageUrl;
    this.userId = props.userId;
    this.spaceId = props.spaceId;
    this.qrId = props.qrId;
    this.qr = props.qr ?? null;
    this.plantingSpotId = props.plantingSpotId;
    this.plantingSpot = props.plantingSpot ?? null;
  }
}
