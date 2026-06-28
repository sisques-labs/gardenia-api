import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('care_schedules')
export class CareScheduleTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'plant_id', type: 'uuid', nullable: false })
  plantId!: string;

  @Column({
    name: 'activity_type',
    type: 'varchar',
    length: 32,
    nullable: false,
  })
  activityType!: string;

  @Column({ name: 'interval_days', type: 'integer', nullable: false })
  intervalDays!: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  quantity!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  unit!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Index()
  @Column({ name: 'next_due_at', type: 'timestamptz', nullable: false })
  nextDueAt!: Date;

  @Column({ name: 'last_completed_at', type: 'timestamptz', nullable: true })
  lastCompletedAt!: Date | null;

  @Column({ type: 'boolean', nullable: false, default: true })
  active!: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index()
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
