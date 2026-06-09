# Spaces Module

Manages **spaces** (multi-tenant workspaces), **memberships** (who belongs to each space and with which role), and **invitations** (shareable codes + QR deep links so new users can join a space).

A space is the tenant boundary for the rest of the platform. Plants, planting spots, QR codes, and users (within a space) are all scoped to an active `spaceId` via `SpaceContext`.

---

## Quick orientation

```
src/contexts/spaces/
├── application/
│   ├── commands/          # create-space, add-member, remove-member,
│   │                      # create-space-invitation, accept-space-invitation
│   ├── queries/           # space-find-by-id, spaces-find-by-user,
│   │                      # membership-find-by-user-and-space
│   ├── ports/             # ISpaceQrPort (hexagonal adapter to QR module)
│   └── services/
│       ├── read/          # assert-* view-model exists services
│       └── write/         # assert-* domain rules, invite code generation,
│                          # target URL builder, resolve-invitation-space-context
├── domain/
│   ├── aggregates/        # SpaceAggregate, SpaceInvitationAggregate
│   ├── entities/          # SpaceMembership
│   ├── builders/          # SpaceBuilder, SpaceInvitationBuilder, …
│   ├── events/            # SpaceCreated, MemberAdded, MemberRemoved,
│   │                      # SpaceInvitationCreated
│   ├── exceptions/        # domain errors mapped to HTTP in spaces-exception.filter
│   ├── repositories/      # read/write interfaces + DI tokens
│   ├── value-objects/     # SpaceId, InvitationCode, …
│   └── view-models/       # SpaceViewModel, SpaceInvitationViewModel
├── infrastructure/
│   ├── adapters/          # SpaceQrAdapter → QR module
│   ├── config/            # spaces.config.ts (invitation expiry, space limits)
│   └── persistence/typeorm/
│       ├── entities/      # spaces, space_memberships, space_invitations
│       ├── mappers/
│       └── repositories/
└── transport/
    ├── guards/            # SpaceGuard (global APP_GUARD in AppModule)
    ├── interceptors/      # SpaceInterceptor (global APP_INTERCEPTOR)
    ├── rest/              # SpacesController, InvitationsController
    └── graphql/           # SpaceQueriesResolver, SpaceMutationsResolver
```

`SpaceGuard` and `SpaceInterceptor` are registered **globally** in `AppModule`. Their source files live here, but they apply to every bounded context that needs tenant scoping.

---

## Core concepts

### Space

A named workspace owned by a user. Creating a space also creates an **owner** membership for that user.

| Field | Notes |
|-------|-------|
| `id` | UUID |
| `name` | Display name (1–100 chars) |
| `ownerId` | User who created the space |
| `memberships` | Embedded collection on `SpaceAggregate` |

### Membership

Links a **user** to a **space** with a role:

| Role | Permissions (summary) |
|------|------------------------|
| `owner` | Full control: invite, add/remove members |
| `member` | Access space data; cannot manage members |

Membership rows live in `space_memberships`. The aggregate enforces invariants such as “cannot remove the last owner” (`LastOwnerRemovalException`).

### Tenant isolation (`SpaceContext`)

Most data in Gardenia is **space-scoped**. Tenant repositories (plants, invitations write path, QR, etc.) call `SpaceContext.require()` to obtain the active `spaceId` and filter queries automatically.

`SpaceContext` is a **global singleton** provided by `SharedModule`. **Do not register it again in `SpacesModule`** — a duplicate instance would break AsyncLocalStorage and cause `SpaceContextMissingException` even when `X-Space-ID` is sent.

---

## Request pipeline: `X-Space-ID`, guard, interceptor

For any route that operates inside a space, the client must send:

```http
Authorization: Bearer <accessToken>
X-Space-ID: <uuid>
```

### 1. `SpaceGuard` (global)

- Skipped when the handler is marked `@SkipSpace()` or `@IdentityOnly()`.
- Otherwise: requires JWT user + `X-Space-ID` header.
- Validates membership via `MembershipFindByUserAndSpaceQuery`.
- Sets `req.spaceId` on success.
- Does **not** call `SpaceContext.run()` — guards finish before the handler runs.

### 2. `SpaceInterceptor` (global)

- Reads `req.spaceId` set by the guard.
- Wraps the handler in `spaceContext.run(spaceId, …)` using Node.js `AsyncLocalStorage`.
- If `req.spaceId` is missing (e.g. `@SkipSpace()` route), passes through without setting context.

### Route decorators

| Decorator | JWT required | `X-Space-ID` required | `SpaceContext` set by |
|-----------|--------------|----------------------|------------------------|
| *(none)* | Yes | Yes | Interceptor (from header) |
| `@SkipSpace()` | Yes | No | Not set (or set manually in handler) |
| `@IdentityOnly()` | Yes | No | Resolved from invitation code (accept flow) |

**Examples**

- `POST /api/spaces`, `GET /api/spaces/me`, `spaceCreate`, `spacesFindByUser` → `@SkipSpace()`
- `spaceAcceptInvitation`, `POST /api/invitations/accept` → `@IdentityOnly()`
- `plantCreate`, `spaceCreateInvitation`, `GET /api/spaces/:id` → default (header required)

---

## How a space is created

```
POST /api/spaces          (@SkipSpace)
spaceCreate mutation      (@SkipSpace)
  └─ CreateSpaceCommandHandler
       ├─ checks MAX_SPACES_PER_USER (owned spaces count)
       ├─ builds SpaceAggregate + owner membership
       ├─ persists via ISpaceWriteRepository (global table, no tenant context)
       └─ publishes SpaceCreatedEvent
```

On registration, the Auth module also dispatches `CreateSpaceCommand` so every new account gets a default space.

---

## Space invitations

Invitations let an **owner** share a link/QR so another authenticated user can join the space. Invitations are **multi-use** until `expiresAt` (default 24 hours, configurable).

### Code format

`InviteCodeGeneratorService` derives a human-friendly code from the space name:

| Stored field | Example | Purpose |
|--------------|---------|---------|
| `code` | `TES2026MR` | Normalized, unique DB key |
| `displayCode` | `TES · 2026 · MR` | Shown to users and embedded in QR URL |

Normalization strips non-alphanumeric characters and uppercases:

```ts
// "TES · 2026 · MR" → "TES2026MR"
InvitationCodeValueObject.normalize(input)
```

Clients may send either format when accepting; both resolve to the same row.

### Creating an invitation

```
POST /api/spaces/:id/invitations     (+ X-Space-ID)
spaceCreateInvitation mutation        (+ X-Space-ID)
  └─ CreateSpaceInvitationCommandHandler
       ├─ assert requester is space owner
       ├─ GenerateUniqueInvitationCodeService (collision retries)
       ├─ SpaceInvitationTargetUrlBuilderService
       │    └─ {QR_BASE_URL}/invite?code={encodeURIComponent(displayCode)}
       ├─ SpaceQrAdapter → CreateQrCommand (QR module)
       ├─ persist SpaceInvitationAggregate (tenant-scoped write repo)
       └─ publish SpaceInvitationCreatedEvent
```

**Response fields** (`SpaceInvitationRestResponseDto` / `SpaceInvitationResponseDto`):

```ts
{
  id: string;
  spaceId: string;
  role: 'owner' | 'member';
  code: string;           // normalized, e.g. "TES2026MR"
  displayCode: string;    // human format, e.g. "TES · 2026 · MR"
  qrId: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

Download the PNG via the QR module: `GET /api/qrs/:qrId/image`.

### End-to-end accept flow (frontend + API)

The QR `targetUrl` points to the **frontend**, not the API:

```
{QR_BASE_URL}/invite?code=TES%20%C2%B7%202026%20%C2%B7%20MR
```

Typical frontend flow:

```
1. User scans QR or opens link
2. Frontend route /invite reads ?code= from the URL
3. If not logged in → redirect to login/register, then return with code
4. Call accept endpoint with JWT (no X-Space-ID header)
5. On success → redirect to space list or dashboard
```

**GraphQL**

```graphql
mutation AcceptInvitation($input: SpaceAcceptInvitationRequestDto!) {
  spaceAcceptInvitation(input: { code: $input.code }) {
    success
    message
    id    # accepting user's id
  }
}
```

**REST**

```http
POST /api/invitations/accept
Authorization: Bearer <token>
Content-Type: application/json

{ "code": "TES · 2026 · MR" }
```

### Accepting on the backend

```
spaceAcceptInvitation / POST /api/invitations/accept  (@IdentityOnly)
  └─ ResolveInvitationSpaceContextService.run(code, fn)
       ├─ lookup invitation by code (global read, no tenant header needed)
       ├─ spaceContext.run(invitation.spaceId, fn)   # opens tenant context
       └─ AcceptSpaceInvitationCommandHandler
            ├─ assert invitation exists and not expired
            ├─ assert user is not already a member
            ├─ space.addMember(userId, invitation.role)
            └─ persist SpaceAggregate
```

`@IdentityOnly()` skips `SpaceGuard` membership checks because the user is joining a space they do not belong to yet. The space is inferred from the invitation code.

---

## REST API

All endpoints require JWT unless noted. Space-scoped routes also require `X-Space-ID`.

| Method | Path | `@SkipSpace` / notes | Description |
|--------|------|----------------------|-------------|
| `POST` | `/api/spaces` | `@SkipSpace` | Create a space |
| `GET` | `/api/spaces/me` | `@SkipSpace` | List spaces for current user |
| `GET` | `/api/spaces/:id` | Header required | Get space by ID |
| `POST` | `/api/spaces/:id/invitations` | Header required | Create invitation + QR |
| `POST` | `/api/spaces/:id/members` | Header required | Add member (owner only) |
| `DELETE` | `/api/spaces/:id/members/:userId` | Header required | Remove member (owner only) |
| `POST` | `/api/invitations/accept` | `@IdentityOnly` | Accept invitation by code |

---

## GraphQL API

| Operation | Type | Decorator | `X-Space-ID` | Description |
|-----------|------|-----------|--------------|-------------|
| `spaceCreate` | Mutation | `@SkipSpace` | No | Create space |
| `spacesFindByUser` | Query | `@SkipSpace` | No | List user's spaces |
| `spaceFindById` | Query | — | Yes | Get space by ID |
| `spaceCreateInvitation` | Mutation | — | Yes | Create invitation |
| `spaceAcceptInvitation` | Mutation | `@IdentityOnly` | No | Accept by code |
| `spaceAddMember` | Mutation | — | Yes | Add member |
| `spaceRemoveMember` | Mutation | — | Yes | Remove member |

Resolvers dispatch commands/queries via `CommandBus` / `QueryBus` only — never call application services directly.

---

## Commands

| Command | Returns | Who can run | Main side effects |
|---------|---------|-------------|-------------------|
| `CreateSpaceCommand` | `spaceId` | Authenticated user | Insert space + owner membership |
| `CreateSpaceInvitationCommand` | `SpaceInvitationViewModel` | Space **owner** | Insert invitation, create QR |
| `AcceptSpaceInvitationCommand` | `userId` | Authenticated user (not yet member) | Add membership, ensure user row |
| `AddMemberCommand` | `void` | Space **owner** | Add membership |
| `RemoveMemberCommand` | `void` | Space **owner** | Remove membership |

---

## Queries

| Query | Returns | Notes |
|-------|---------|-------|
| `SpaceFindByIdQuery` | `SpaceViewModel` | Used by REST/GraphQL get-by-id |
| `SpacesFindByUserQuery` | `PaginatedResult<SpaceViewModel>` | All spaces for a user |
| `MembershipFindByUserAndSpaceQuery` | `SpaceMembership \| null` | Used by `SpaceGuard` |

---

## Cross-module ports

### `ISpaceQrPort` → `SpaceQrAdapter`

Dispatches `CreateQrCommand` to the QR bounded context. Keeps Spaces decoupled from QR infrastructure.

---

## Configuration

Registered via `ConfigModule.forFeature(spacesConfig)` in `SpacesModule`:

| Env variable | Default | Description |
|--------------|---------|-------------|
| `MAX_SPACES_PER_USER` | `5` | Max spaces a user may own |
| `SPACE_INVITATION_DEFAULT_EXPIRY_HOURS` | `24` | Default invitation TTL |
| `SPACE_INVITATION_CODE_COLLISION_MAX_RETRIES` | `5` | Retries when generated code already exists |

Invitation QR URLs use `QR_BASE_URL` from `app.config.ts` (required at boot). In development this is typically the frontend origin, e.g. `http://localhost:3000`.

---

## Domain exceptions → HTTP status

Mapped in `transport/exceptions/spaces-exception.filter.ts`:

| Exception | HTTP |
|-----------|------|
| `SpaceLimitExceededException` | 409 Conflict |
| `DuplicateMembershipException` | 409 Conflict |
| `InvitationExpiredException` | 410 Gone |
| `SpaceNotFoundException` | 404 Not Found |
| `InvitationNotFoundException` | 404 Not Found |
| `NotASpaceMemberException` | 404 Not Found |
| `NotSpaceOwnerException` | 403 Forbidden |
| `LastOwnerRemovalException` | 422 Unprocessable Entity |
| `SpaceContextMissingException` | 500 Internal Server Error |

---

## Database

### `spaces`

Global table (not tenant-filtered). One row per workspace.

### `space_memberships`

Links `user_id` ↔ `space_id` with `role`. Queried for guard checks and space listings.

### `space_invitations`

| Column | Notes |
|--------|-------|
| `id` | UUID PK |
| `space_id` | FK → `spaces`, CASCADE delete |
| `created_by_user_id` | Owner who created the invite |
| `role` | Role granted on accept (`member` or `owner`) |
| `code` | Unique normalized code (`TES2026MR`) |
| `display_code` | Human-readable format |
| `qr_id` | Optional FK to `qrs` table |
| `expires_at` | Invitation expiry |

Migration: `src/database/migrations/1780000000013-CreateSpaceInvitations.ts`

**Repository scoping**

- `findByCode` on the write/read repos uses the **raw** repository (global lookup by normalized code) — required for the accept flow without `X-Space-ID`.
- `save` / tenant-filtered queries on the write repo use `createTenantRepository` + `SpaceContext`.

---

## Tests

| Layer | Location |
|-------|----------|
| Unit | `src/contexts/spaces/**/*.spec.ts` |
| Integration | `test/integration/spaces/space-invitation-typeorm.integration-spec.ts` |
| E2E | `test/e2e/spaces/space-invitations.e2e-spec.ts`, `space-guard.e2e-spec.ts`, `cross-space-isolation.e2e-spec.ts` |

E2E invitation tests use REST. GraphQL accept/create mirror the same command handlers.

---

## Things to know before making changes

1. **`SpaceContext` is global** — import from `@shared/space-context/space-context.service`; never add it to `SpacesModule.providers`.
2. **Guards vs interceptor** — membership validation belongs in `SpaceGuard`; ALS `run()` belongs in `SpaceInterceptor` (or `ResolveInvitationSpaceContextService` for `@IdentityOnly()` routes).
3. **Handlers do not call `spaceContext.run()`** for normal header-based routes — the interceptor already opened the frame. Manual `run()` is only for flows without `X-Space-ID` (accept invitation, register-account space creation).
4. **Invitation accept is frontend-driven** — the API does not serve `/invite`; it only exposes accept mutations/endpoints. The frontend must implement `/invite?code=…`.
5. **Owner-only operations** — creating invitations, adding members, and removing members all assert the requester is the space owner via `AssertUserIsSpaceOwnerService`.
6. **Codes are reusable until expiry** — accepting an invitation does not invalidate the code; multiple users could join with the same link before `expiresAt` (if that is ever undesirable, add a use-count or revoke-on-accept rule in the domain).
