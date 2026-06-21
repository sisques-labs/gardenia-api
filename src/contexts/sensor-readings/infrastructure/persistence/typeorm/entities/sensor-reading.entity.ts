import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sensor_readings')
@Index('IDX_sensor_readings_latest', [
  'spaceId',
  'plantId',
  'metric',
  'measuredAt',
])
export class SensorReadingTypeOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'plant_id', type: 'uuid', nullable: false })
  plantId!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  metric!: string;

  @Column({ type: 'decimal', precision: 14, scale: 4, nullable: false })
  value!: string;

  @Column({ type: 'varchar', length: 50, nullable: false, default: '' })
  unit!: string;

  @Column({ name: 'measured_at', type: 'timestamptz', nullable: false })
  measuredAt!: Date;

  @Column({ type: 'varchar', length: 200, nullable: false, default: '' })
  source!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
