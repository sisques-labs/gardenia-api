import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { IBridgePrimitives } from '@contexts/nodes/domain/primitives/bridge.primitives';

export class BridgeViewModel extends BaseViewModel {
  public readonly spaceId: string | null;
  public readonly name: string | null;
  public readonly status: string;
  public readonly pairingCode: string | null;
  public readonly lastSeenAt: Date | null;

  constructor(props: IBridgePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.spaceId = props.spaceId;
    this.name = props.name;
    this.status = props.status;
    this.pairingCode = props.pairingCode;
    this.lastSeenAt = props.lastSeenAt;
  }
}
