# Tasks: Resolve the JWT / Tenant Conflict (Header-Only Tenant Resolution)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120–160 (test additions + one doc-comment block; source diff only) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Lock-in tests (`space.guard.spec.ts`, `jwt.strategy.spec.ts`) + doc comment | PR 1 | `pnpm test -- space.guard.spec.ts jwt.strategy.spec.ts` | N/A — unit specs, manual mocks, no DB/server needed | `git revert` single commit; no schema, migration, or runtime code touched |

No production logic changes in this change. Tests are characterization/lock-in: each new case is expected to pass immediately against current code, proving the invariant already holds rather than driving new behavior.

## Phase 1: Space Guard Lock-In Tests (transport)

- [ ] 1.1 Extend `buildMockContext` in `src/contexts/spaces/transport/guards/space.guard.spec.ts` with optional `userExtras?: Record<string, unknown>` merged into `req['user']`.
- [ ] 1.2 Add `describe('tenant-resolution policy lock-in')`, case: `user` carries `{spaceId, tenants}`, no `x-space-id` header → `BadRequestException`; `queryBus.execute` not called.
- [ ] 1.3 Add case: `user.spaceId = OTHER_SPACE_ID`, header `SPACE_ID`, membership resolves → query built with `spaceId: SPACE_ID`; `req['spaceId'] === SPACE_ID`.
- [ ] 1.4 Add case: `user.tenants = [{id: SPACE_ID}]`, header `SPACE_ID`, `queryBus.execute` resolves `null` → `ForbiddenException`.
- [ ] 1.5 Add case: no claim fields, header `SPACE_ID`, membership resolves → `req['spaceId'] === SPACE_ID`.
- [ ] 1.6 Run `pnpm test -- space.guard.spec.ts` — new and existing cases pass unmodified.

## Phase 2: JWT Strategy Lock-In Tests (infrastructure)

- [ ] 2.1 Add `describe('tenant-resolution policy lock-in')` to `src/contexts/auth/infrastructure/strategies/jwt.strategy.spec.ts`, case: `Object.keys(strategy.validate({sub, email, role: 'admin'})).sort()` equals `['appRole', 'email', 'userId']` (exact key-set, not `toEqual`).
- [ ] 2.2 Add case: payload cast with extra `spaceId`/`tenants` fields alongside `{sub, email}` → result has `undefined` for both, same exact key set as 2.1.
- [ ] 2.3 Run `pnpm test -- jwt.strategy.spec.ts` — new cases pass unmodified.

## Phase 3: Doc Comment

- [ ] 3.1 Append second top-of-file comment block to `src/contexts/spaces/transport/guards/space.guard.ts`, below the existing `// ALS Decision:` block, before imports, with the design's exact text citing `tenant-resolution-policy` spec. No change to `canActivate()`.

## Spec-to-Test Traceability Map

| Spec scenario | Test case(s) |
|---|---|
| tenant-resolution-policy: Header present resolves the tenant | 1.5 |
| tenant-resolution-policy: Token claim ignored, header required | 1.2, 1.3, 1.4 |
| tenant-resolution-policy: Future integration attempts claim-based selection | None — governance scenario for future proposals; enforced by spec text + design Forward Constraint, not a unit test |
| auth: Gardenia's own token stays selector-free | 2.1 (`validate()` output); `TokenService.sign()` itself untouched/untested here per design's no-new-file scope |
| auth: External or membership-list claim never becomes the current tenant | 1.2, 1.3, 1.4 (guard side), 2.2 (`validate()` drops claim fields) |
| auth: Session table remains schema-unchanged | None — no schema/migration touched, out of scope |
| auth: Future external-identity integration must still comply | None — governance scenario, enforced by spec text |
