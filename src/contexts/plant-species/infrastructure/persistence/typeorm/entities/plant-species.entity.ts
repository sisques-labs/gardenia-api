import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plant_species')
@Unique(['scientificName'])
export class PlantSpeciesTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'scientific_name',
    type: 'varchar',
    length: 300,
    nullable: false,
  })
  scientificName!: string;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description!: string | null;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
