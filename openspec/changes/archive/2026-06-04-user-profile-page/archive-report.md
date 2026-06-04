# Archive Report: user-profile-page

**Archived**: 2026-06-04
**Status**: COMPLETE
**PR**: sisques-labs/gardenia-web #104 (branch `claude/user-profile-page-H84Ok`)

---

## Summary

A user profile page was added to `gardenia-web`. Authenticated users can view and edit their profile data (`username`, `firstName`, `lastName`, `avatarUrl`, `bio`, `locale`, `timezone`) via a form at `/[lang]/profile`. The `gardenia-api` required no changes — `userFindById` and `userUpdate` GraphQL resolvers were already implemented. All 24 tasks complete.

---

## Delivery

| PR | Scope | Status |
|----|-------|--------|
| gardenia-web #104 | Full users module (domain → application → infrastructure → presentation) + route + shared UI | ✅ merged to `claude/user-profile-page-H84Ok` |

---

## Artifacts Archived

| Artifact | Path |
|----------|------|
| Proposal | `openspec/changes/archive/2026-06-04-user-profile-page/proposal.md` |
| Spec | `openspec/changes/archive/2026-06-04-user-profile-page/spec.md` |
| Design | `openspec/changes/archive/2026-06-04-user-profile-page/design.md` |
| Tasks | `openspec/changes/archive/2026-06-04-user-profile-page/tasks.md` |

---

## Key Design Decisions (for traceability)

- **`fetchPolicy: 'network-only'` on `getById`** — Apollo's default cache-first would return stale data after `userUpdate`; network-only ensures the React Query invalidation always triggers a fresh server fetch.
- **`useEffect([user])` form reset** — form defaults are set via `reset()` when user data arrives asynchronously, which is the correct react-hook-form pattern for async-loaded data.
- **`useUserInitials` extracted to hook** — screen components must have minimal/no logic (project convention); initials derivation belongs in a hook.
- **`FormField` composition** — children prop supports both `<Input>` and `<textarea>` from a single shared component, avoiding repetition without over-engineering.
- **`Avatar` via `@radix-ui/react-avatar`** — consistent with the shadcn/ui component set; Radix handles image-load-failure fallback natively.
- **`UpdateUserInput` imported from its own file** — ports must not re-export types from other modules.

---

## Review Notes

Five review comments on PR #104 were addressed:
1. Removed `UpdateUserInput` re-export from port — import directly from interface file.
2. Confirmed domain `User` interface fields match `UserResponseDto` (dates as `string` due to GQL serialisation).
3. Extracted `initials` computation to `useUserInitials` hook.
4. Generalised repeated label+input+error pattern into shared `FormField` component.
5. Replaced custom avatar `div` with shadcn `Avatar/AvatarImage/AvatarFallback`.

---

## Verify: PASS (0 CRITICAL, 0 WARNING)

- `pnpm exec tsc --noEmit` — clean
- `pnpm lint` — 0 new errors/warnings introduced by this change
- `pnpm test` (i18n-parity.test.ts) — pass
