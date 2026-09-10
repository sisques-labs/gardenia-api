# Proposal: Resolve the JWT / Tenant Conflict (Header-Only Tenant Resolution)

**Change**: resolve-jwt-tenant-conflict
**Phase**: proposal
**Date**: 2026-09-10
**Artifact store**: openspec

---

## Intent

Sisques Account returns tenant memberships in a JWT (ADR-0004), while gardenia's archived multitenant decision (`archive/2026-05-29-multitenant/specs/auth/spec.md` §2.2, §4) declares "no `spaceId` in the JWT" and "final". Read literally, that clause governs only gardenia's **own** `TokenService.sign()` output and `auth_sessions` schema. The ambiguity is an open platform question and blocks the deferred "migrate gardenia-api to consume Sisques Account" change. Success: one durable spec-level rule settling it for every current and future auth mechanism, with zero behavioral change today.

## Scope

### In Scope
- Rule: the **current** tenant/space is resolved ONLY from the `X-Space-ID` header (generalizable to `X-Tenant-ID`) plus a DB membership lookup — never from a JWT claim, whoever issued the token.
- Rule: a JWT gardenia issues or verifies MAY carry membership **lists** as identity metadata; such claims MUST NOT act as a current-tenant selector.
- Scope clarification of archived §2.2/§4, recorded here and as an `auth` delta (archive untouched).
- Lock-in tests in existing specs only: `space.guard.spec.ts` (a `spaceId`/`tenants` claim neither satisfies nor overrides the header) and `jwt.strategy.spec.ts` (`validate()` emits no tenant selector).

### Out of Scope
- Any Sisques Account adapter, JWKS client, token exchange, or `nestjs-kit` bump.
- Changes to `SpaceGuard`, `SpaceInterceptor`, `SpaceContext`, `TokenService`, or JWT payload shape — already compliant.
- Edits to `openspec/changes/archive/2026-05-29-multitenant/**` (immutable).
- The deferred Sisques Account migration (blocked on this; separately scoped, not started).

## Capabilities

### New Capabilities
- `tenant-resolution-policy`: mechanism-agnostic rule for current-tenant resolution, permitted JWT claim semantics, and the constraint any future external-identity integration must satisfy.

### Modified Capabilities
- `auth`: §2.2 re-scoped from "no `spaceId` in the JWT" to "no current-tenant *selector* from any JWT claim; gardenia's own token stays selector-free; identity-only membership metadata permitted".

## Approach

Explore Option 3 (scoping clarification) as decision record, carrying Option 1's identity-only constraint as a forward requirement instead of code. Codify existing behavior as an invariant, then guard it with regression tests so a future integration cannot drift silently.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `openspec/specs/tenant-resolution-policy/spec.md` | New (at archive) | The policy |
| `openspec/specs/auth/spec.md` | Modified | §2.2 re-scoped |
| `spaces/transport/guards/space.guard.spec.ts` | Modified | Claim-ignored regression |
| `auth/infrastructure/strategies/jwt.strategy.spec.ts` | Modified | No tenant selector |
| `spaces/transport/guards/space.guard.ts` | Modified | Doc comment citing rule |

**Bounded contexts impacted**: `auth`, `spaces` — tests and docs only, no runtime behavior change.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Read as permission to trust external tenant claims | Med | Rule bans claim-derived *current* tenant |
| Account verification mechanism (JWKS vs HS256) unconfirmed | Med | Policy is mechanism-agnostic |
| Policy drifts when migration lands | Low | Lock-in tests plus spec requirement |

## Rollback Plan

Docs and tests only: revert the commit. Specs return to prior text, the two `.spec.ts` files lose added cases. No runtime code, schema, migration, or token invalidation.

## Dependencies

- Confirmed decision: Engram `sdd/resolve-jwt-tenant-conflict/decision`.
- Migration deferral: `platform/docs/architecture/sisques-account/status-and-mvp.md`.

## Delivery Strategy

Single PR — docs plus two test additions, far below the 400-line budget.

## Success Criteria

- [ ] `tenant-resolution-policy` spec states the header-only rule and the identity-metadata allowance.
- [ ] `auth` delta re-scopes §2.2 without contradicting the archive.
- [ ] `SpaceGuard` still rejects a token-only space/tenant claim with no header.
- [ ] `JwtStrategy.validate()` output has no current-tenant field.
- [ ] The platform open question can close citing this change.
