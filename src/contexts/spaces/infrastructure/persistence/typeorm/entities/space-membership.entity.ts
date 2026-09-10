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

@Entity('space_memberships')
@Unique(['spaceId', 'userId'])
@Index(['userId'])
export class SpaceMembershipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Column({ type: 'varchar', nullable: false })
  role!: string;

  @Column({ name: 'joined_at', type: 'timestamp', nullable: false })
  joinedAt!: Date;

  /**
   * Last successful reconciliation against account-api's tenant-membership
   * API (design.md D4). NULL = "never synced" = stale. Not yet read or
   * written by `SpaceMembershipTypeOrmMapper`/the domain entity — that
   * wiring lands with `MembershipProjectionSyncGuard` (design.md D4, a
   * later work unit).
   */
  @Column({ name: 'synced_at', type: 'timestamp', nullable: true })
  syncedAt!: Date | null;

  @ManyToOne(() => SpaceEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'space_id' })
  space?: SpaceEntity;
}
