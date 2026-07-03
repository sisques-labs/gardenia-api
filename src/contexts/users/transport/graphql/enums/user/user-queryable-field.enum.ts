/**
 * Whitelist of `User` fields a client can filter/sort by via
 * `usersFindByCriteria`. Transport-only — not a domain concept, so it lives
 * here rather than in `domain/enums/`.
 *
 * Covers every scalar field on `UserViewModel` that maps to a real column on
 * the `users` table. `spaceId` is deliberately excluded: every query is
 * already implicitly scoped to the active space via `SpaceContext`, so
 * exposing it as a client-choosable filter would be redundant.
 */
export enum UserQueryableField {
  ID = 'id',
  STATUS = 'status',
  USERNAME = 'username',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  AVATAR_URL = 'avatarUrl',
  BIO = 'bio',
  LOCALE = 'locale',
  TIMEZONE = 'timezone',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}
