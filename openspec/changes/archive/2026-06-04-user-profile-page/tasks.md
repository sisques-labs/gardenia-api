# Tasks: user-profile-page

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~520 (all new files) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Delivery strategy | single PR |

---

## New Files — Domain

- [x] **Create** `src/core/users/domain/interfaces/user.interface.ts` — `User` domain model matching `UserResponseDto`; `createdAt`/`updatedAt` typed as `string` (GraphQL ISO serialisation).

## New Files — Application

- [x] **Create** `src/core/users/application/interfaces/update-user-input.interface.ts` — `UpdateUserInput` with `id` + all nullable editable fields.
- [x] **Create** `src/core/users/application/ports/users.repository.port.ts` — `IUsersRepository` with `getById(id)` and `update(input)`.
- [x] **Create** `src/core/users/application/use-cases/get-user/get-user.use-case.ts` — `GetUserUseCase`.
- [x] **Create** `src/core/users/application/use-cases/update-user/update-user.use-case.ts` — `UpdateUserUseCase`; imports `UpdateUserInput` directly from its interface file (not re-exported via port).

## New Files — Infrastructure

- [x] **Create** `src/core/users/infrastructure/repositories/graphql/queries/user-find-by-id.query.ts` — `USER_FIND_BY_ID` gql tag.
- [x] **Create** `src/core/users/infrastructure/repositories/graphql/mutations/user-update.mutation.ts` — `USER_UPDATE` gql tag.
- [x] **Create** `src/core/users/infrastructure/repositories/graphql/responses/user-find-by-id.response.ts` — typed response wrapper.
- [x] **Create** `src/core/users/infrastructure/repositories/graphql/responses/user-update.response.ts` — typed mutation response.
- [x] **Create** `src/core/users/infrastructure/repositories/graphql/users.gql.repository.ts` — `UsersGqlRepository` with `fetchPolicy: 'network-only'` on `getById`.

## New Files — Presentation: Hooks

- [x] **Create** `src/core/users/presentation/hooks/use-user/use-user.hook.ts` — TanStack React Query wrapper around `GetUserUseCase`.
- [x] **Create** `src/core/users/presentation/hooks/use-update-user/use-update-user.hook.ts` — `useMutation` wrapper; invalidates `['user', id]` on success.
- [x] **Create** `src/core/users/presentation/hooks/use-update-user-profile-form/use-update-user-profile-form.hook.ts` — react-hook-form + zod; `useEffect([user])` resets form when data loads.
- [x] **Create** `src/core/users/presentation/hooks/use-user-initials/use-user-initials.hook.ts` — `useMemo` computing first+last initials or `username[0]`.

## New Files — Presentation: i18n + Schema

- [x] **Create** `src/core/users/presentation/i18n/en.ts` — English dictionary (`UsersDict`).
- [x] **Create** `src/core/users/presentation/i18n/es.ts` — Spanish dictionary.
- [x] **Create** `src/core/users/presentation/i18n/i18n-parity.test.ts` — Vitest test asserting en/es key parity.
- [x] **Create** `src/core/users/presentation/schemas/update-user-profile.schema.ts` — Zod schema for the profile form.

## New Files — Presentation: Screen

- [x] **Create** `src/core/users/presentation/screens/user-profile/user-profile.screen.tsx` — `'use client'` screen; `ProfileSkeleton` sub-component; `fieldError()` maps Zod key → i18n string; all logic in hooks.

## New Files — Route

- [x] **Create** `app/[lang]/(protected)/profile/page.tsx` — Next.js App Router page; resolves locale; passes `dict.users` to `UserProfileScreen`.

## New Files — Shared UI

- [x] **Create** `src/shared/presentation/components/ui/avatar.tsx` — shadcn `Avatar`, `AvatarImage`, `AvatarFallback` via `@radix-ui/react-avatar`.
- [x] **Create** `src/shared/presentation/components/ui/form-field.tsx` — `FormField` with label + children + optional error.

## Modified Files

- [x] **Modify** `src/shared/presentation/i18n/get-dictionary.ts` — import `UsersDict`; add `users` key to `AppDict`; wire en/es dictionaries.
- [x] **Modify** `src/shared/presentation/components/sidebar-nav-items/nav-items.ts` — add Profile nav entry with `User` icon.
- [x] **Modify** `package.json` — add `@radix-ui/react-avatar` dependency.
- [x] **Modify** `pnpm-lock.yaml` — updated lockfile.
