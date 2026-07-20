import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/**
 * `plant_identification_id` is a real, DB-enforced FK (`ON DELETE CASCADE`)
 * to `plant_identifications.id` — intra-aggregate, unlike cross-context
 * references (see `file_id`, deliberately NOT FK-enforced: `files` is a
 * separate bounded context). The constraint is declared in the migration,
 * not via a TypeORM relation decorator here — same convention
 * `plant_photos.file_id` uses for its own (cross-context) FK.
 */
@Entity('plant_identification_photos')
@Index('IDX_plant_identification_photos_plant_identification_id', [
  'plantIdentificationId',
])
export class PlantIdentificationPhotoTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plant_identification_id', type: 'uuid', nullable: false })
  plantIdentificationId!: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: false })
  fileId!: string;

  @Column({ name: 'url', type: 'varchar', length: 1024, nullable: false })
  url!: string;

  @Column({ name: 'organ', type: 'varchar', nullable: false })
  organ!: string;

  @Column({ name: 'position', type: 'smallint', nullable: false })
  position!: number;
}
