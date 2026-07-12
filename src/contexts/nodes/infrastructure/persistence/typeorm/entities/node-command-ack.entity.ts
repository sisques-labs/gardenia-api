import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('node_command_acks')
export class NodeCommandAckTypeOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'command_id', type: 'varchar', length: 64, nullable: true })
  @Index('IDX_node_command_acks_command_id')
  commandId!: string | null;

  @Column({ name: 'node_id', type: 'uuid', nullable: false })
  nodeId!: string;

  @Column({ name: 'space_id', type: 'uuid', nullable: false })
  spaceId!: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  result!: string;

  @Column({ name: 'received_at', type: 'timestamptz', nullable: false })
  receivedAt!: Date;
}
