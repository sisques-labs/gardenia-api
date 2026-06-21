export type ApiTokenPrimitives = {
  id: string;
  userId: string;
  spaceId: string;
  label: string;
  tokenHash: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
