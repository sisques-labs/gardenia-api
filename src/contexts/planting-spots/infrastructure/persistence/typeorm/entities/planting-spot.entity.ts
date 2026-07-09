import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('planting_spots')
export class PlantingSpotTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  type!: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description!: string | null;

  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Column({ name: 'spot_row', type: 'int', nullable: true })
  row!: number | null;

  @Column({ name: 'spot_column', type: 'int', nullable: true })
  column!: number | null;

  @Column({
    name: 'dimensions_width',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  dimensionsWidth!: number | null;

  @Column({
    name: 'dimensions_height',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  dimensionsHeight!: number | null;

  @Column({
    name: 'dimensions_length',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  dimensionsLength!: number | null;

  @Column({ name: 'soil_type', type: 'varchar', length: 100, nullable: true })
  soilType!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: false, default: 'active' })
  status!: string;

  @Column({ name: 'fallow_since', type: 'timestamptz', nullable: true })
  fallowSince!: Date | null;

  @Column({ name: 'qr_id', type: 'uuid', nullable: true })
  qrId!: string | null;

  @Index('IDX_planting_spots_user_id')
  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index('IDX_planting_spots_space_id')
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
