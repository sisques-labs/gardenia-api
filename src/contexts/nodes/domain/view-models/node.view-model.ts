import { BaseViewModel } from '@sisques-labs/nestjs-kit';

import { INodePrimitives } from '@contexts/nodes/domain/primitives/node.primitives';

export class NodeViewModel extends BaseViewModel {
  public readonly spaceId: string;
  public readonly bridgeId: string;
  public readonly name: string | null;
  public readonly status: string;
  public readonly lastSeenAt: Date | null;

  constructor(props: INodePrimitives) {
    super(props.id, props.createdAt, props.updatedAt);
    this.spaceId = props.spaceId;
    this.bridgeId = props.bridgeId;
    this.name = props.name;
    this.status = props.status;
    this.lastSeenAt = props.lastSeenAt;
  }
}
