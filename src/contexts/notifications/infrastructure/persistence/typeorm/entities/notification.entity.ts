import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notifications')
@Index('IDX_notifications_space_user_status', ['spaceId', 'userId', 'status'])
@Index('IDX_notifications_space_dedupe_key', ['spaceId', 'dedupeKey'])
export class NotificationTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  type!: string;

  @Column({
    name: 'reference_type',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  referenceType!: string;

  @Column({ name: 'reference_id', type: 'uuid', nullable: false })
  referenceId!: string;

  @Column({ name: 'dedupe_key', type: 'varchar', length: 300, nullable: false })
  dedupeKey!: string;

  @Column({ type: 'jsonb', nullable: false, default: {} })
  payload!: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, nullable: false })
  status!: string;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index()
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
