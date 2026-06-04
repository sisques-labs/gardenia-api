export interface IOAuthIdentityLinkedEventData {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
}
