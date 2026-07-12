export interface IBridgeEventData {
  id: string;
  spaceId: string | null;
  name: string | null;
  status: string;
  pairingCode: string | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
