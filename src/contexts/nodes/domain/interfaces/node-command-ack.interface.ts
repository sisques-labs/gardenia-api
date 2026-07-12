export interface INodeCommandAck {
  commandId: string | null;
  nodeId: string;
  spaceId: string;
  result: string;
  receivedAt: Date;
}
