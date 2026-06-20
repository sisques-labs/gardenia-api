import { CreatePlantQrInput } from '@contexts/plants/application/ports/create-plant-qr.input';
import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';

export const PLANT_QR_PORT = Symbol('PLANT_QR_PORT');

export interface IPlantQrPort {
  findByQrId(qrId: string): Promise<PlantQrViewModel | null>;
  createForPlant(input: CreatePlantQrInput): Promise<string>;
  delete(qrId: string): Promise<void>;
}
