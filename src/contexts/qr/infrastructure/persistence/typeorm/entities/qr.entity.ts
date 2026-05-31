import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('qrs')
export class QrTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({
    name: 'target_url',
    type: 'varchar',
    length: 2000,
    nullable: false,
  })
  targetUrl!: string;

  @Column({ name: 'png_image', type: 'bytea', nullable: false })
  pngImage!: Buffer;

  @Column({ type: 'int', nullable: false, default: 1 })
  generation!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
