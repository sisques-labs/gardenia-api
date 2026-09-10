import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('spaces')
export class SpaceEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ name: 'owner_id', type: 'uuid', nullable: false })
  ownerId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude!: number | null;

  @Column({ name: 'environment', type: 'varchar', length: 10, nullable: true })
  environment!: string | null;

  /**
   * Bridge column for spaces that predate platform tenant provisioning
   * (design.md D6). New spaces adopt the platform tenant UUID as `id`
   * directly and leave this NULL — it is not yet read or written by
   * `SpaceTypeOrmMapper`/the domain aggregate; that wiring lands with the
   * `CreateSpaceCommandHandler` two-path logic (design.md D7).
   */
  @Column({ name: 'external_tenant_id', type: 'uuid', nullable: true })
  externalTenantId!: string | null;
}
