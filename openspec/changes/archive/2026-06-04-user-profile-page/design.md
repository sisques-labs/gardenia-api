# Design: user-profile-page

> Technical design for the `gardenia-web` users module. No API-side changes.

---

## 1. Module Structure

```
src/core/users/
├─ domain/
│  └─ interfaces/
│     └─ user.interface.ts            # User domain model
├─ application/
│  ├─ interfaces/
│  │  └─ update-user-input.interface.ts
│  ├─ ports/
│  │  └─ users.repository.port.ts     # IUsersRepository
│  └─ use-cases/
│     ├─ get-user/get-user.use-case.ts
│     └─ update-user/update-user.use-case.ts
├─ infrastructure/
│  └─ repositories/graphql/
│     ├─ queries/user-find-by-id.query.ts
│     ├─ mutations/user-update.mutation.ts
│     ├─ responses/user-find-by-id.response.ts
│     ├─ responses/user-update.response.ts
│     └─ users.gql.repository.ts      # UsersGqlRepository
└─ presentation/
   ├─ hooks/
   │  ├─ use-user/use-user.hook.ts
   │  ├─ use-update-user/use-update-user.hook.ts
   │  ├─ use-update-user-profile-form/use-update-user-profile-form.hook.ts
   │  └─ use-user-initials/use-user-initials.hook.ts
   ├─ i18n/
   │  ├─ en.ts
   │  ├─ es.ts
   │  └─ i18n-parity.test.ts
   ├─ schemas/
   │  └─ update-user-profile.schema.ts   # Zod schema
   └─ screens/
      └─ user-profile/user-profile.screen.tsx
```

---

## 2. Domain Model

```typescript
// user.interface.ts
export interface User {
  id: string;
  status: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  locale?: string | null;
  timezone?: string | null;
  createdAt: string;   // ISO string — GraphQL serialises Date to string
  updatedAt?: string | null;
}
```

**Decision:** `createdAt`/`updatedAt` are typed as `string` (not `Date`) because the GraphQL transport serialises `Date` scalars as ISO strings before reaching the client.

---

## 3. Apollo Cache Strategy

**Problem:** Apollo's default `cache-first` policy would serve the cached user object after `userUpdate`, causing the form to display stale values even after React Query invalidates and re-fetches.

**Decision:** `fetchPolicy: 'network-only'` on every `UsersGqlRepository.getById()` call. This forces a fresh network request on every React Query re-fetch, guaranteeing the form always shows the latest server state after a successful mutation.

---

## 4. Presentation Data Flow

```
useAuthStore (currentUser.id)
  └─> useUser(id)
        └─> GetUserUseCase.execute(id)
              └─> UsersGqlRepository.getById(id)  [network-only]
                    └─> userFindById GQL query

useUpdateUserProfileForm(user)
  ├─ react-hook-form (zod resolver)
  ├─ useEffect([user]) → form.reset(user fields)  // loads async data into form
  └─ onSubmit → useUpdateUser.mutate(input)
                  └─> UpdateUserUseCase.execute(input)
                        └─> UsersGqlRepository.update(input)
                              └─> userUpdate GQL mutation
                  onSuccess → queryClient.invalidateQueries(['user', id])
```

---

## 5. Form Validation (Zod)

```typescript
const updateUserProfileSchema = z.object({
  username: z.string().min(3).max(30),
  firstName: z.string().nullable().optional(),
  lastName:  z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  bio:       z.string().max(500).nullable().optional(),
  locale:    z.string().nullable().optional(),
  timezone:  z.string().nullable().optional(),
});
```

Validation messages use short keys (e.g. `'usernameMin'`) that the screen maps to i18n strings via a `fieldError()` helper, keeping the schema decoupled from i18n.

---

## 6. Shared UI Components

### FormField

Composition pattern (children prop) so the same wrapper handles both `<Input>` and `<textarea>` without needing separate variants.

```typescript
interface FormFieldProps {
  label: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}
```

### Avatar

Standard shadcn/ui pattern using `@radix-ui/react-avatar`. Three sub-components:
- `Avatar` — root, `overflow-hidden rounded-full`
- `AvatarImage` — `aspect-square object-cover`
- `AvatarFallback` — shown when image fails to load; receives initials from `useUserInitials`

**Decision:** `useUserInitials` is extracted to its own hook (not inlined in the screen) to keep the screen component free of logic. The hook computes `firstName[0] + lastName[0]` when both are present, falling back to `username[0]`.

---

## 7. Route

```typescript
// app/[lang]/(protected)/profile/page.tsx
export default async function ProfilePage({ params }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return <UserProfileScreen dict={dict.users} lang={locale} />;
}
```

The page lives under `(protected)` so the existing auth guard applies without any additional configuration.

---

## 8. ADR Summary

| # | Decision | Rejected alternative | Why |
|---|----------|----------------------|-----|
| 1 | `fetchPolicy: 'network-only'` on `getById` | default `cache-first` | Apollo cache would serve stale data after mutation |
| 2 | `useUpdateUserProfileForm` resets via `useEffect([user])` | set defaults at `useQuery` time | async data arrives after form mounts; `reset` is the correct react-hook-form pattern |
| 3 | `useUserInitials` extracted to own hook | inline in screen | screen must have minimal/no logic (project convention) |
| 4 | `FormField` (children composition) | separate `InputField`/`TextareaField` variants | one component handles all field types without duplication |
| 5 | shadcn `Avatar` / Radix UI | custom `div` + `Image` | Radix handles image-load-failure fallback natively; consistent with shadcn component set |
| 6 | `UpdateUserInput` imported directly from its interface file | re-exported from port | ports should not re-export types from other modules (reviewer feedback) |
