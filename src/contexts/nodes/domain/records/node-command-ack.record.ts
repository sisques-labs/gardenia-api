import { UuidValueObject } from '@sisques-labs/nestjs-kit';

/**
 * Insert-only record — same treatment as {@link NodeTelemetryReading}
 * (design.md §3.4). `commandId` is nullable until `gardenia-bridge` ships
 * the envelope field needed to correlate an ack with the command that
 * originated it (see proposal.md Out of Scope).
 */
export class NodeCommandAck {
  private constructor(
    public readonly id: string,
    public readonly commandId: string | null,
    public readonly nodeId: string,
    public readonly spaceId: string,
    public readonly result: string,
    public readonly receivedAt: Date,
  ) {}

  static create(props: {
    commandId: string | null;
    nodeId: string;
    spaceId: string;
    result: string;
    receivedAt: Date;
  }): NodeCommandAck {
    return new NodeCommandAck(
      UuidValueObject.generate().value,
      props.commandId,
      props.nodeId,
      props.spaceId,
      props.result,
      props.receivedAt,
    );
  }
}
