import { QrAggregate } from '@contexts/qr/domain/aggregates/qr.aggregate';

export const QR_WRITE_REPOSITORY = Symbol('QR_WRITE_REPOSITORY');

export interface IQrWriteRepository {
  findById(id: string): Promise<QrAggregate | null>;
  save(aggregate: QrAggregate, pngImage: Buffer): Promise<QrAggregate>;
  delete(id: string): Promise<void>;
}
