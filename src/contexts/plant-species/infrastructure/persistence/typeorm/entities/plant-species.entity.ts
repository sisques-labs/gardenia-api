import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plant_species')
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

  @Column({ name: 'gbif_key', type: 'int', nullable: true })
  gbifKey!: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
