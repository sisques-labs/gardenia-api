import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bridges')
@Index('IDX_bridges_space_id', ['spaceId'])
export class BridgeTypeOrmEntity {
  // Bridge-supplied UUID (generated on-device, not by gardenia-api) — no
  // @PrimaryGeneratedColumn.
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: true })
  spaceId!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'UNCLAIMED',
  })
  status!: string;

  @Column({ name: 'pairing_code', type: 'varchar', length: 16, nullable: true })
  pairingCode!: string | null;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
