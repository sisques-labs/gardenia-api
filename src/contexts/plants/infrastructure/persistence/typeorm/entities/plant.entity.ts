import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plants')
@Index('IDX_plants_space_id', ['spaceId'])
@Index('IDX_plants_user_id', ['userId'])
@Index('IDX_plants_plant_species_id', ['plantSpeciesId'])
@Index('IDX_plants_planting_spot_id', ['plantingSpotId'])
export class PlantTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name!: string;

  @Column({ name: 'plant_species_id', type: 'uuid', nullable: true })
  plantSpeciesId!: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'qr_id', type: 'uuid', nullable: true })
  qrId!: string | null;

  @Column({ name: 'planting_spot_id', type: 'uuid', nullable: true })
  plantingSpotId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
