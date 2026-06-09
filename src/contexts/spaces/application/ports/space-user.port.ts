export const SPACE_USER_PORT = Symbol('SPACE_USER_PORT');

export interface ISpaceUserPort {
  ensureUserExists(userId: string): Promise<void>;
}
