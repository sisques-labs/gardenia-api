import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class FileTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  filename!: string;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: false })
  mimeType!: string;

  @Column({ type: 'int', nullable: false })
  size!: number;

  @Column({
    name: 'storage_key',
    type: 'varchar',
    length: 512,
    nullable: false,
  })
  storageKey!: string;

  @Column({ type: 'varchar', length: 1024, nullable: false })
  url!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index('IDX_files_space_id')
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
