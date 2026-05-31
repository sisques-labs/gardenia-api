import { PlantQrViewModel } from '@contexts/plants/domain/view-models/plant-qr.view-model';

export const PLANT_QR_PORT = Symbol('PLANT_QR_PORT');

export interface IPlantQrPort {
  findByQrId(qrId: string): Promise<PlantQrViewModel | null>;
}
