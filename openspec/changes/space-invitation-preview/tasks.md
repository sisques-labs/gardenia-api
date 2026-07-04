# Tasks: Space Invitation Preview & Structured Errors

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–420 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | PR1: query + handler · PR2: transport + error filter fix + e2e |
| Delivery strategy | sequential-PRs |
| Decision needed before apply | No |

---

## PR 1: Query + handler

### 1.1 Domain / application

- [ ] 1.1 Create `SpaceInvitationPreview` read projection (interface or lightweight view-model — no persistence entity)
- [ ] 1.2 Create `GetSpaceInvitationPreviewByCodeQuery` + handler:
      - reuse `AssertSpaceInvitationViewModelExistsByCodeService` (throws `InvitationNotFoundException`)
      - compute `isExpired` inline (no throw)
      - `SpaceContext.run(invitation.spaceId, () => spaceReadRepository.findById(...))` for `spaceName`
- [ ] 1.3 Unit specs: found + non-expired, found + expired (`isExpired: true`, no throw), not found (throws)
- [ ] 1.4 Wire query handler in `spaces.module.ts`

---

## PR 2: Transport + error filter fix + E2E

### 2.1 REST

- [ ] 2.1 Create `SpaceInvitationPreviewResponseDto` + mapper method
- [ ] 2.2 Add `GET /invitations/:code` to `InvitationsController` — `@SkipSpace()`, no `JwtAuthGuard`, Swagger docs (200/404)

### 2.2 GraphQL

- [ ] 2.3 Create `SpaceInvitationPreviewResponseDto` (GraphQL) + mapper
- [ ] 2.4 Add `spaceInvitationPreview(code: String!)` to `SpaceQueriesResolver` — `@SkipSpace()`, no auth guard
- [ ] 2.5 Unit specs: controller + resolver dispatch correct query, map response correctly

### 2.3 Error filter fix

- [ ] 2.6 Update `src/core/filters/base-exception.filter.ts` GraphQL branch: construct `GraphQLError` with `extensions: { code: exception.name, statusCode: status }` instead of `Object.assign` re-throw
- [ ] 2.7 Unit spec for `BaseExceptionFilter`: GraphQL branch asserts `extensions.code`; REST branch behavior unchanged (regression check)

### 2.4 E2E

- [ ] 2.8 E2E: `GET /api/invitations/:code` without auth header → 200 with preview payload (`test/e2e/spaces/space-invitation-preview.e2e-spec.ts`)
- [ ] 2.9 E2E: preview an expired code → 200 with `isExpired: true`
- [ ] 2.10 E2E: preview an unknown code → 404
- [ ] 2.11 E2E (GraphQL): `spaceAcceptInvitation` with expired code → `errors[0].extensions.code === "InvitationExpiredException"`
- [ ] 2.12 E2E (GraphQL): `spaceInvitationPreview` without `Authorization` header → succeeds

---

## Post-implementation

- [ ] 3.1 Update `CHANGELOG.md` under Unreleased
- [ ] 3.2 Run `pnpm test`, `pnpm test:integration`, `pnpm test:e2e`, `pnpm lint`, `pnpm build`
