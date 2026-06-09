import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { SpaceEntity } from './space.entity';

@Entity('space_invitations')
@Unique(['code'])
@Index(['spaceId'])
@Index(['expiresAt'])
export class SpaceInvitationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'created_by_user_id', type: 'uuid', nullable: false })
  createdByUserId!: string;

  @Column({ type: 'varchar', nullable: false })
  role!: string;

  @Column({ type: 'varchar', nullable: false })
  code!: string;

  @Column({ name: 'display_code', type: 'varchar', nullable: false })
  displayCode!: string;

  @Column({ name: 'qr_id', type: 'uuid', nullable: true })
  qrId!: string | null;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  expiresAt!: Date;

  @Column({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: false })
  updatedAt!: Date;

  @ManyToOne(() => SpaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space?: SpaceEntity;
}
