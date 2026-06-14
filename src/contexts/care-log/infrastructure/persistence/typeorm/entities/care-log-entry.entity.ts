import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('care_log_entries')
@Index('IDX_care_log_entries_plant_id_space_id', ['plantId', 'spaceId'])
@Index('IDX_care_log_entries_performed_at', [
  'plantId',
  'spaceId',
  'performedAt',
])
export class CareLogEntryTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plant_id', type: 'uuid', nullable: false })
  plantId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index('IDX_care_log_entries_space_id')
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({
    name: 'activity_type',
    type: 'varchar',
    length: 32,
    nullable: false,
  })
  activityType!: string;

  @Column({ name: 'performed_at', type: 'timestamptz', nullable: false })
  performedAt!: Date;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Column({
    name: 'quantity',
    type: 'decimal',
    precision: 10,
    scale: 3,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value != null ? parseFloat(value) : null,
    },
  })
  quantity!: number | null;

  @Column({ name: 'unit', type: 'varchar', length: 8, nullable: true })
  unit!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
