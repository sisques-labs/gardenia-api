import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** See `plant-identification-photo.entity.ts` for the FK convention note. */
@Entity('plant_identification_candidates')
@Index('IDX_plant_identification_candidates_plant_identification_id', [
  'plantIdentificationId',
])
export class PlantIdentificationCandidateTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plant_identification_id', type: 'uuid', nullable: false })
  plantIdentificationId!: string;

  @Column({
    name: 'scientific_name',
    type: 'varchar',
    length: 300,
    nullable: false,
  })
  scientificName!: string;

  @Column({ name: 'score', type: 'numeric', precision: 5, scale: 4 })
  score!: number;

  @Column({ name: 'rank', type: 'smallint', nullable: false })
  rank!: number;
}
