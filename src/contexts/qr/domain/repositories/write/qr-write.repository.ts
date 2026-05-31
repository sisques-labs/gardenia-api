import { QrAggregate } from '../../aggregates/qr.aggregate';

export const QR_WRITE_REPOSITORY = Symbol('QR_WRITE_REPOSITORY');

/** Optional persistence metadata; not part of the QrAggregate. */
export interface QrSaveOptions {
  plantId?: string;
}

export interface IQrWriteRepository {
  findById(id: string): Promise<QrAggregate | null>;
  save(
    aggregate: QrAggregate,
    pngImage: Buffer,
    options?: QrSaveOptions,
  ): Promise<QrAggregate>;
  delete(id: string): Promise<void>;
}
