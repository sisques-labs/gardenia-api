import { NodeIdValueObject } from '@contexts/nodes/domain/value-objects/node-id/node-id.value-object';

export interface NodeFindByIdQueryInput {
  nodeId: string;
}

export class NodeFindByIdQuery {
  public readonly nodeId: NodeIdValueObject;

  constructor(input: NodeFindByIdQueryInput) {
    this.nodeId = new NodeIdValueObject(input.nodeId);
  }
}
