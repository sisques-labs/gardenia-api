export const NODE_COMMAND_PRODUCER_PORT = Symbol('NODE_COMMAND_PRODUCER_PORT');

export interface SendNodeCommandInput {
  commandId: string;
  nodeId: string;
  commandType: string;
  payload: unknown;
}

/**
 * Port for producing an outbound node command to `gardenia-bridge.commands`.
 * Deliberately NOT the kit's `IEventPublisher` — that port's envelope and
 * topic scheme are shaped for domain-event forwarding, not a raw device
 * command. See design.md §1/§5.6.
 */
export interface INodeCommandProducerPort {
  send(input: SendNodeCommandInput): Promise<void>;
}
