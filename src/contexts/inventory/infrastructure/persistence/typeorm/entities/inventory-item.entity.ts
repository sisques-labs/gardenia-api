import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('inventory_items')
export class InventoryItemTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'item_type', type: 'varchar', length: 50, nullable: false })
  itemType!: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  brand!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 3, nullable: false })
  quantity!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  unit!: string;

  @Column({
    name: 'low_stock_threshold',
    type: 'decimal',
    precision: 12,
    scale: 3,
    nullable: true,
  })
  lowStockThreshold!: string | null;

  @Column({ name: 'acquired_at', type: 'timestamptz', nullable: true })
  acquiredAt!: Date | null;

  @Index()
  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ name: 'user_id', type: 'uuid', nullable: false })
  userId!: string;

  @Index()
  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}
