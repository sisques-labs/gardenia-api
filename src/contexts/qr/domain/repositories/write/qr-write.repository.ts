import { QrAggregate } from '../../aggregates/qr.aggregate';

export const QR_WRITE_REPOSITORY = Symbol('QR_WRITE_REPOSITORY');

export interface IQrWriteRepository {
  findById(id: string): Promise<QrAggregate | null>;
  findByPlantId(plantId: string): Promise<QrAggregate | null>;
  save(aggregate: QrAggregate, pngImage: Buffer): Promise<QrAggregate>;
  deleteByPlantId(plantId: string): Promise<void>;
}
