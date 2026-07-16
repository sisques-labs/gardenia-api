import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * One common name reported for a candidate — normalized out of
 * `plant_identification_candidates` (a `text[]` column is not relational).
 * `candidate_id` is a real, DB-enforced FK (`ON DELETE CASCADE`) to
 * `plant_identification_candidates.id` — intra-aggregate, same convention
 * `plant_identification_photos.plant_identification_id` uses.
 */
@Entity('plant_identification_candidate_common_names')
@Index('IDX_plant_identification_candidate_common_names_candidate_id', [
  'candidateId',
])
export class PlantIdentificationCandidateCommonNameTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'candidate_id', type: 'uuid', nullable: false })
  candidateId!: string;

  @Column({ name: 'name', type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ name: 'position', type: 'smallint', nullable: false })
  position!: number;
}
