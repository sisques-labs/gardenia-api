import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('nodes')
@Index('IDX_nodes_space_id', ['spaceId'])
@Index('IDX_nodes_bridge_id', ['bridgeId'])
export class NodeTypeOrmEntity {
  // Node-supplied UUID (the physical device's own id, used on MQTT topics
  // too) — no @PrimaryGeneratedColumn.
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'bridge_id', type: 'uuid', nullable: false })
  bridgeId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false, default: 'OFFLINE' })
  status!: string;

  @Column({ name: 'last_seen_at', type: 'timestamptz', nullable: true })
  lastSeenAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
