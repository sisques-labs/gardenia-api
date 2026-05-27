import { UserStatusEnum } from '@sisques-labs/nestjs-kit';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class UserTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  status!: UserStatusEnum;

  @Column({ type: 'varchar', length: 30, nullable: false, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  locale!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  timezone!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
