import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('harvests')
export class HarvestTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'crop_type', type: 'varchar', length: 200, nullable: false })
  cropType!: string;

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: false })
  quantity!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  unit!: string;

  @Column({ name: 'harvested_at', type: 'timestamptz', nullable: false })
  harvestedAt!: Date;

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
