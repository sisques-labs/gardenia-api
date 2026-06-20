export const SPACE_PROVISIONING_PORT = Symbol('SPACE_PROVISIONING_PORT');

export interface CreateDefaultSpaceInput {
  ownerId: string;
  name: string;
}

/**
 * Seam between `auth` and the `spaces` context. Registration and first-time
 * OAuth login create a default space for the new owner; this port hides the
 * `spaces` command behind a stable contract so the handlers never import
 * `@contexts/spaces` directly.
 */
export interface ISpaceProvisioningPort {
  createDefaultSpace(input: CreateDefaultSpaceInput): Promise<string>;
}
