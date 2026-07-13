export const USER_DIRECTORY_PORT = Symbol('USER_DIRECTORY_PORT');

export interface IUserDirectoryPort {
  /** Reads the ambient SpaceContext to resolve active members of the current space. */
  listActiveMemberUserIds(): Promise<string[]>;
}
