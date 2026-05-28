export type AuthSessionPrimitives = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  deviceInfo: string | null;
  createdAt: Date;
  updatedAt: Date;
};
