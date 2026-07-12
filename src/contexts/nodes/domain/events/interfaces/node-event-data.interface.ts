export interface INodeEventData {
  id: string;
  spaceId: string;
  bridgeId: string;
  name: string | null;
  status: string;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
