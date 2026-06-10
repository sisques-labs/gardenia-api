import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('task_templates')
export class TaskTemplateTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'handler_key', type: 'varchar', length: 255, nullable: true })
  handlerKey!: string | null;

  @Column({
    name: 'default_priority',
    type: 'smallint',
    nullable: false,
    default: 5,
  })
  defaultPriority!: number;

  @Column({
    name: 'default_retry_count',
    type: 'smallint',
    nullable: false,
    default: 3,
  })
  defaultRetryCount!: number;

  @Column({
    name: 'default_backoff_strategy',
    type: 'varchar',
    length: 20,
    nullable: false,
    default: 'exponential',
  })
  defaultBackoffStrategy!: string;

  @Column({
    name: 'default_timeout_ms',
    type: 'integer',
    nullable: false,
    default: 30000,
  })
  defaultTimeoutMs!: number;

  @Column({
    name: 'max_concurrency',
    type: 'smallint',
    nullable: false,
    default: 5,
  })
  maxConcurrency!: number;

  @Column({
    name: 'default_cron_expression',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  defaultCronExpression!: string | null;

  @Column({
    name: 'default_is_recurring',
    type: 'boolean',
    nullable: false,
    default: false,
  })
  defaultIsRecurring!: boolean;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
