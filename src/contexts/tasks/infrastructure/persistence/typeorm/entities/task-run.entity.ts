import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TaskTypeOrmEntity } from './task.entity';

@Entity('task_runs')
export class TaskRunTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'task_id', type: 'uuid', nullable: false })
  taskId!: string;

  @ManyToOne(() => TaskTypeOrmEntity, { eager: false })
  @JoinColumn({ name: 'task_id' })
  task?: TaskTypeOrmEntity;

  @Column({ type: 'smallint', nullable: false, default: 1 })
  attempt!: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  status!: string;

  @Column({ type: 'smallint', nullable: false, default: 0 })
  progress!: number;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: false })
  startedAt!: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
