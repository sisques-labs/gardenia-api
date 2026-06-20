export const USER_PROVISIONING_PORT = Symbol('USER_PROVISIONING_PORT');

/**
 * Seam between `auth` and the `users` context. The auth flows provision and
 * deprovision the user record that backs an account; this port hides the
 * `users` commands behind a stable contract so the handlers never import
 * `@contexts/users` directly.
 */
export interface IUserProvisioningPort {
  createUser(userId: string): Promise<void>;
  deleteUser(userId: string): Promise<void>;
}
