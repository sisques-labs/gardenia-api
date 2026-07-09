import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plant_photos')
@Index('IDX_plant_photos_plant_id_space_id', ['plantId', 'spaceId'])
@Index('IDX_plant_photos_plant_id_space_id_created_at', [
  'plantId',
  'spaceId',
  'createdAt',
])
export class PlantPhotoTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plant_id', type: 'uuid', nullable: false })
  plantId!: string;

  @Column({ name: 'file_id', type: 'uuid', nullable: false })
  fileId!: string;

  @Column({ name: 'url', type: 'varchar', length: 1024, nullable: false })
  url!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index('IDX_plant_photos_space_id')
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
