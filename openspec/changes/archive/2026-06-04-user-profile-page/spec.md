# Spec: User Profile Page (gardenia-web)

**Change**: user-profile-page
**Phase**: spec
**Date**: 2026-06-04
**Status**: done
**Repo**: gardenia-web (web-only delta — no API changes)

---

## 1. Overview

This spec describes the user profile page added to `gardenia-web`. It is a pure frontend change: the `gardenia-api` already exposes `userFindById` and `userUpdate` GraphQL operations that satisfy all data requirements.

---

## 2. Route

- The profile page MUST be available at `/[lang]/profile`.
- The route MUST be protected — unauthenticated users MUST be redirected to login by the existing auth guard.
- `[lang]` MUST be resolved via the existing locale detection logic (`isLocale` + `DEFAULT_LOCALE`).

---

## 3. Navigation

- A **Profile** entry MUST appear in the sidebar navigation.
- The entry MUST use the `User` icon from `lucide-react`, consistent with other nav items.

---

## 4. Profile View

**Given** an authenticated user navigates to `/[lang]/profile`
**When** the page loads
**Then** the user's current profile data MUST be displayed:
- Avatar (image if `avatarUrl` is set; initials fallback otherwise)
- `@username`
- Member-since date (formatted via `toLocaleDateString` using the active locale)

**Given** the profile data is loading
**When** the page renders before the query resolves
**Then** a skeleton placeholder MUST be shown instead of the form

---

## 5. Editable Fields

The profile form MUST allow editing the following fields:

| Field | Required | Constraints |
|-------|----------|-------------|
| `username` | Yes | 3–30 characters |
| `firstName` | No | nullable |
| `lastName` | No | nullable |
| `avatarUrl` | No | nullable |
| `bio` | No | max 500 characters; nullable |
| `locale` | No | nullable; hint: BCP-47 tag e.g. `en-US` |
| `timezone` | No | nullable; hint: IANA tz e.g. `America/New_York` |

`status` MUST NOT be editable from the profile page (admin-only concern).

---

## 6. Form Behaviour

**Given** the profile data has loaded
**When** the form is rendered
**Then** all editable fields MUST be pre-populated with the current user values

**Given** the form is pre-populated and the user changes one or more fields
**When** the user submits the form
**Then** `userUpdate` MUST be called with the modified values
**And** on success the form MUST reflect the latest saved state

**Given** the `username` field contains fewer than 3 characters
**When** the user submits the form
**Then** a validation error MUST be shown beneath the `username` field
**And** the mutation MUST NOT be called

**Given** the `bio` field exceeds 500 characters
**When** the user submits the form
**Then** a validation error MUST be shown beneath the `bio` field
**And** the mutation MUST NOT be called

**Given** the mutation succeeds
**When** the server responds
**Then** a success message MUST be displayed inline
**And** the React Query cache for `['user', id]` MUST be invalidated so the form reflects the saved state

**Given** the mutation fails
**When** the server responds with an error
**Then** a generic error message MUST be displayed inline
**And** the user MUST be able to retry

---

## 7. i18n

- All user-visible strings MUST be sourced from the `users` dictionary key added to `AppDict`.
- English (`en`) and Spanish (`es`) translations MUST exist.
- Key parity between `en` and `es` MUST be enforced by an automated test (`i18n-parity.test.ts`).

---

## 8. Out of Scope

- Password change / account security settings
- Avatar file upload (URL input only)
- Admin-level user management (status field, role changes)
- `usersFindByCriteria` (listing / searching users)
- `userDelete`
