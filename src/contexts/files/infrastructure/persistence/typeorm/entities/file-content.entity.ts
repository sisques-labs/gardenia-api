import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

/**
 * Raw file bytes for the database storage backend. Owned exclusively by
 * `DatabaseFileStorageAdapter` — no other layer references this entity. Keyed by
 * the file id (its `storageKey`) and isolated per tenant via `spaceId`.
 */
@Entity('file_contents')
export class FileContentTypeOrmEntity {
  @PrimaryColumn({ name: 'file_id', type: 'uuid' })
  fileId!: string;

  @Index('IDX_file_contents_space_id')
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ type: 'bytea', nullable: false })
  data!: Buffer;
}
