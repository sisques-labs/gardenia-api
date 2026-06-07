import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TaskTemplateTypeOrmEntity } from './task-template.entity';

@Entity('tasks')
export class TaskTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'task_template_id', type: 'uuid', nullable: false })
  taskTemplateId!: string;

  @ManyToOne(() => TaskTemplateTypeOrmEntity, { eager: false })
  @JoinColumn({ name: 'task_template_id' })
  taskTemplate?: TaskTemplateTypeOrmEntity;

  @Index()
  @Column({ type: 'varchar', length: 20, nullable: false, default: 'pending' })
  status!: string;

  @Column({ type: 'jsonb', nullable: false, default: '{}' })
  payload!: Record<string, unknown>;

  @Column({ type: 'smallint', nullable: false, default: 5 })
  priority!: number;

  @Column({ name: 'delay_ms', type: 'integer', nullable: true })
  delayMs!: number | null;

  @Column({ name: 'cron_expression', type: 'varchar', length: 100, nullable: true })
  cronExpression!: string | null;

  @Column({ name: 'is_recurring', type: 'boolean', nullable: false, default: false })
  isRecurring!: boolean;

  @Column({ name: 'max_runs', type: 'integer', nullable: true })
  maxRuns!: number | null;

  @Column({ name: 'run_count', type: 'integer', nullable: false, default: 0 })
  runCount!: number;

  @Column({ name: 'idempotency_key', type: 'varchar', length: 255, nullable: true, unique: true })
  idempotencyKey!: string | null;

  @Column({ name: 'queue_job_id', type: 'varchar', length: 255, nullable: true })
  queueJobId!: string | null;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Column({ name: 'scheduled_at', type: 'timestamp', nullable: true })
  scheduledAt!: Date | null;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt!: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
