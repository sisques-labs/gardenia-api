import {
  Column,
  Entity,
  Index,
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

  @ManyToOne(() => SpaceEntity, { onDelete: 'CASCADE' })
  space?: SpaceEntity;
}
