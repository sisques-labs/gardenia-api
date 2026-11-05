import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('accounts')
@Unique(['spaceId', 'email'])
@Index('IDX_accounts_space_id', ['spaceId'])
@Index('UQ_accounts_external_subject', ['externalSubject'], {
  unique: true,
  where: '"external_subject" IS NOT NULL',
})
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ name: 'space_id', type: 'uuid' })
  spaceId!: string;

  @Column({ type: 'varchar' })
  email!: string;

  @Column({ type: 'varchar' })
  passwordHash!: string;

  @Column({ name: 'app_role', type: 'varchar', default: 'user' })
  appRole!: string;

  @Column({ name: 'external_subject', type: 'varchar', nullable: true })
  externalSubject!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
