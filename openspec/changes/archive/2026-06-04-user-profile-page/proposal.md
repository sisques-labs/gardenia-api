# Proposal: User Profile Page (gardenia-web)

## Intent

Implement a user profile page in `gardenia-web` so that authenticated users can view and edit their own profile data. The backend already exposes `userFindById` and `userUpdate` GraphQL operations — no API changes are needed.

## Scope

### In Scope

- A new `users` module in `gardenia-web` following the clean architecture convention: domain → application (use-cases + ports) → infrastructure (GQL repositories) → presentation (hooks + screens).
- A protected route at `/[lang]/profile` that renders the user profile form.
- A sidebar navigation entry pointing to the profile route.
- Full i18n support (en / es) consistent with the existing dictionary pattern.
- Shared UI components: `FormField` wrapper and `Avatar` (shadcn/ui + Radix UI) added to `src/shared/presentation/components/ui/`.

### Out of Scope

- API changes — `userFindById` and `userUpdate` GraphQL resolvers already exist and are complete.
- Password change / account security settings.
- Avatar upload (the field accepts a URL only).
- Admin-level user management.

## Capabilities

### New Capabilities

- **User profile view + edit**: authenticated user can see all their profile fields (`username`, `firstName`, `lastName`, `avatarUrl`, `bio`, `locale`, `timezone`) and save changes via the `userUpdate` mutation.

## Approach

Reuse the existing clean-architecture layer convention established for the `auth` and `spaces` modules on the web side:
- Domain interface mirrors the API `UserResponseDto` (dates serialised as ISO strings by GraphQL).
- Application use-cases (`GetUserUseCase`, `UpdateUserUseCase`) depend on `IUsersRepository` port.
- Infrastructure `UsersGqlRepository` implements the port via Apollo Client (`fetchPolicy: 'network-only'` to prevent stale cache after mutation).
- Presentation exposes three hooks: `useUser` (TanStack React Query), `useUpdateUser` (useMutation + invalidate), `useUpdateUserProfileForm` (react-hook-form + zod reset-on-load).
- Screen component holds no logic — all behaviour delegated to hooks; shared `FormField` + `Avatar` components keep markup thin.

## Affected Areas

| Area | Repo | Impact |
|------|------|--------|
| `src/core/users/` (new module) | gardenia-web | New — full clean-arch stack |
| `app/[lang]/(protected)/profile/page.tsx` | gardenia-web | New — Next.js App Router page |
| `src/shared/presentation/components/ui/avatar.tsx` | gardenia-web | New — shadcn Avatar component |
| `src/shared/presentation/components/ui/form-field.tsx` | gardenia-web | New — shared form field wrapper |
| `src/shared/presentation/i18n/get-dictionary.ts` | gardenia-web | Modified — added `users` dict key |
| `src/shared/presentation/components/sidebar-nav-items/nav-items.ts` | gardenia-web | Modified — added Profile nav entry |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Apollo cache-first serving stale user data after mutation | High | `fetchPolicy: 'network-only'` on `getById` |
| Form showing old values after save (React Query refetch) | Med | `queryClient.invalidateQueries` on mutation success; cache-busted by network-only |
| `@radix-ui/react-avatar` not in lockfile | Low (package missing) | Added to `package.json`; lockfile updated |

## Rollback Plan

All changes are additive. Removing the `profile` page and `users` module has no impact on existing routes or modules.

## Success Criteria

- [x] Profile page loads and displays current user data.
- [x] Editing any field and saving calls `userUpdate` and refreshes the form.
- [x] TypeScript strict-mode passes with no errors.
- [x] i18n parity test (en/es key symmetry) passes.
- [x] CI lint + type-check green.
