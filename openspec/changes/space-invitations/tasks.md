# Tasks: Space Invitations (Phase 1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 750–1000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1: domain+persistence · PR2: commands+port · PR3: transport+e2e |
| Delivery strategy | chained-PRs |
| Decision needed before apply | No |
| Chained PRs recommended | Yes |
| 400-line budget risk | High |

---

## PR 1: Domain, migration, persistence

### 1.1 Domain layer

- [x] 1.1 Create `SpaceInvitation` aggregate, `ISpaceInvitation`, primitives, builder, `InvitationCodeValueObject`, `InvitationExpiresAtValueObject`
- [x] 1.2 Create `SpaceInvitationCreatedEvent` + event data interface
- [x] 1.3 Create exceptions: `InvitationNotFoundException`, `InvitationExpiredException` — register in `base-exception.filter.ts`
- [x] 1.4 Create read/write repository interfaces + DI tokens; read repo MUST expose `findByCode(code): Promise<SpaceInvitation | null>` (identity-scoped impl)
- [x] 1.5 Unit specs: aggregate `create()`, builder, code VO normalization

### 1.2 Infrastructure persistence

- [x] 1.6 Create `SpaceInvitationTypeOrmEntity` + migration `{timestamp}-CreateSpaceInvitations.ts` (`code` UNIQUE, indexes on `space_id`, `expires_at`)
- [x] 1.7 Create `SpaceInvitationTypeOrmMapper`, identity-scoped read repo + tenant write repo
- [x] 1.8 Integration spec: `test/integration/spaces/space-invitation-typeorm.integration-spec.ts` — persist, global `findByCode`, tenant isolation on space-scoped queries

---

## PR 2: Application commands, QR port, code generator

### 2.1 Ports and services

- [x] 2.1 Create `ISpaceQrPort` + `SPACE_QR_PORT` token (`createInvitationQr({ targetUrl, spaceId, expiresAt }) → qrId`)
- [x] 2.2 Create `SpaceQrAdapter` dispatching `CreateQrCommand` — unit spec with mocked `CommandBus`
- [x] 2.3 Create `InviteCodeGeneratorService` + `SpaceInvitationTargetUrlBuilderService` (uses `QR_BASE_URL`)
- [x] 2.4 Wire port + services in `spaces.module.ts`

### 2.2 Commands

- [x] 2.5 Create `CreateSpaceInvitationCommand` + handler — owner check, default 24h expiry, code gen, QR port, save, events
- [x] 2.6 Create `AcceptSpaceInvitationCommand` + handler — global lookup, expiry check, `SpaceContext.run`, `CreateUserCommand` if needed, `addMember`, save
- [x] 2.7 Extend `AddMemberCommand` + handler with optional `role` (default `MEMBER`) — update unit specs
- [ ] 2.8 Unit specs: create handler (owner, expiry, QR failure), accept handler (happy path, expired, duplicate, not found)

### 2.3 Queries (optional read models)

- [x] 2.9 Create `SpaceInvitationFindByIdQuery` + handler + view-model if transport needs post-create fetch (skip if create returns full DTO)

---

## PR 3: Transport + E2E

### 3.1 REST

- [x] 3.1 Create invitation DTOs + `SpaceInvitationRestMapper`
- [x] 3.2 Add `POST /spaces/:spaceId/invitations` to `SpacesController` (or dedicated controller) — owner, logs entry
- [x] 3.3 Add `InvitationsController` with `POST /invitations/accept` + `@IdentityOnly()` — logs entry
- [ ] 3.4 Unit specs: controllers dispatch correct commands

### 3.2 GraphQL

- [x] 3.5 Create `SpaceInvitationResponseDto`, input types, mapper
- [x] 3.6 Add `spaceCreateInvitation` to `SpaceMutationsResolver` (space context, owner)
- [x] 3.7 Add `spaceAcceptInvitation` mutation with `@IdentityOnly()` on method
- [x] 3.8 Unit specs: resolvers mock buses

### 3.3 E2E

- [x] 3.9 E2E: owner creates invitation → second user accepts via code → `SpacesFindByUserQuery` / membership guard passes (`test/e2e/spaces/space-invitations.e2e-spec.ts`)
- [x] 3.10 E2E: expired invitation returns expected error code

---

## Post-implementation

- [x] 4.1 Update `CHANGELOG.md` under Unreleased
- [x] 4.2 Run `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm lint`, `pnpm build`
