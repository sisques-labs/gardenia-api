export const SPACE_DIRECTORY_PORT = Symbol('SPACE_DIRECTORY_PORT');

export interface ISpaceDirectoryPort {
  /** Cross-tenant by nature — does not require an active SpaceContext. */
  listAllSpaceIds(): Promise<string[]>;
}
