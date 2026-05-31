import { QrViewModel } from '../../view-models/qr.view-model';

export const QR_READ_REPOSITORY = Symbol('QR_READ_REPOSITORY');

export interface IQrReadRepository {
  findById(id: string): Promise<QrViewModel | null>;
  findByPlantId(plantId: string): Promise<QrViewModel | null>;
  findPngById(id: string): Promise<Buffer | null>;
}
