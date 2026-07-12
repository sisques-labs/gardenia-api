import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('node_telemetry_readings')
@Index('IDX_node_telemetry_readings_space_node_recorded', [
  'spaceId',
  'nodeId',
  'recordedAt',
])
export class NodeTelemetryReadingTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'node_id', type: 'uuid', nullable: false })
  nodeId!: string;

  @Column({ name: 'sensor_type', type: 'varchar', length: 30, nullable: false })
  sensorType!: string;

  @Column({ type: 'numeric', nullable: false })
  value!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  unit!: string | null;

  @Column({ name: 'recorded_at', type: 'timestamptz', nullable: false })
  recordedAt!: Date;
}
