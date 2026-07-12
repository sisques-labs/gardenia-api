import { NodeCommandAck } from '@contexts/nodes/domain/records/node-command-ack.record';

export const NODE_COMMAND_ACK_WRITE_REPOSITORY = Symbol(
  'NODE_COMMAND_ACK_WRITE_REPOSITORY',
);

/** Same narrow, insert-only shape as {@link INodeTelemetryReadingWriteRepository}. */
export interface INodeCommandAckWriteRepository {
  insert(ack: NodeCommandAck): Promise<void>;
}
