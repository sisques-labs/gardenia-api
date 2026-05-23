export type FindUserByEmailResult = {
  id: string;
  email: string;
  passwordHash: string;
} | null;
