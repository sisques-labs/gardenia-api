import { CreatePlantingSpotQrInput } from '@contexts/planting-spots/application/ports/create-planting-spot-qr.input';
import { PlantingSpotQrViewModel } from '@contexts/planting-spots/domain/view-models/planting-spot-qr.view-model';

export const PLANTING_SPOT_QR_PORT = Symbol('PLANTING_SPOT_QR_PORT');

export interface IPlantingSpotQrPort {
  findByQrId(qrId: string): Promise<PlantingSpotQrViewModel | null>;
  createForPlantingSpot(input: CreatePlantingSpotQrInput): Promise<string>;
  delete(qrId: string): Promise<void>;
}
