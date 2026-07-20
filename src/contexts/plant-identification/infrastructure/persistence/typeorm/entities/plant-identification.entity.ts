import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plant_identifications')
@Index('IDX_plant_identifications_space_id', ['spaceId'])
@Index('IDX_plant_identifications_space_id_requested_by_user_id_created_at', [
  'spaceId',
  'requestedByUserId',
  'createdAt',
])
export class PlantIdentificationTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'requested_by_user_id', type: 'uuid', nullable: false })
  requestedByUserId!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'status', type: 'varchar', nullable: false })
  status!: string;

  @Column({ name: 'resolved_species_key', type: 'integer', nullable: true })
  resolvedSpeciesKey!: number | null;

  @Column({
    name: 'resolved_scientific_name',
    type: 'varchar',
    length: 300,
    nullable: true,
  })
  resolvedScientificName!: string | null;

  @Column({
    name: 'resolved_species_provider',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  resolvedSpeciesProvider!: string | null;

  @Column({ name: 'converted_to_plant_id', type: 'uuid', nullable: true })
  convertedToPlantId!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
