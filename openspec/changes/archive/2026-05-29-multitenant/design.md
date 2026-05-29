# Design: Multi-Tenancy via Spaces

## Technical Approach

Row-Level Security. Isolation lives ONLY in transport (`SpaceGuard`) and infrastructure (`SpaceContext` + `TenantRepository`). Domain/application stay tenant-agnostic. JWT identifies the user (`{ sub, email }`); `X-Space-ID` header identifies the active Space per request. `SpaceGuard` validates membership and hydrates an `AsyncLocalStorage`-backed `SpaceContext`; every TypeORM repository routes reads/writes through a tenant-aware wrapper that injects `spaceId` and fails closed when context is empty.

Resolved facts: `typeorm@1.0.0` (modern DataSource/Repository API). nestjs-kit `IBaseWriteRepository`/`IBaseReadRepository` are **interfaces only** — repos `implements` them and inject a raw `Repository<T>` via `@InjectRepository`. There is NO kit base class to subclass; the "mixin" therefore WRAPS the injected `Repository<T>`, it does not extend a sealed kit class. `CurrentUser` reads `req.user` for both REST and GraphQL.

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|----------|----------------------|-----------|
| 1 | `SpaceMembership` = child entity of `Space` aggregate | Own aggregate | Membership has no lifecycle outside its Space; invariants (no dup, owner protected) are Space-level. |
| 2 | `SpaceContext` = **global singleton** wrapping `AsyncLocalStorage` | REQUEST-scoped provider | ALS already gives per-request isolation. REQUEST scope would force every consumer (repos) request-scoped, killing perf and breaking singleton repos. Singleton + ALS store = correct idiom. |
| 3 | Tenant scoping via **wrapper around injected `Repository<T>`** (`createTenantRepository(repo, ctx)`) | Subclass kit base repo (none exists); TypeORM global `@Filter` | Repos own a raw `Repository<T>`; wrapping its `findOne/findAndCount/find/save/delete` is the only seam. TS mixin over a class is impossible since there is no shared concrete base. |
| 4 | `SpaceGuard` = **global guard**, registered via `APP_GUARD`, with `@Public()`/`@SkipSpace()` metadata for registration/login | Per-endpoint guard | Fail-closed by default: forgetting to annotate a new endpoint denies access, not leaks. Opt-out is explicit. |
| 5 | Registration **internally orchestrates** Space creation (handler calls `CreateSpaceCommand` then writes membership) | Event-driven post-auth | Atomicity: account+space+owner-membership must succeed together. Eventual consistency would leave accounts with no Space. |
| 6 | `auth_sessions` stays **user-global** (no `spaceId`) | Space-scoped sessions | Sessions identify the USER; the active Space is chosen per request via header. |
| 7 | `MAX_SPACES_PER_USER=5`, env-configurable, enforced in `CreateSpaceCommandHandler` | Domain invariant on Space | Cap is a cross-aggregate count (spaces per user), not a single-aggregate invariant. Belongs in application. |

## Data Flow (authenticated request)

    Request ─→ JwtAuthGuard ─→ SpaceGuard ──────────────┐
    (Bearer + X-Space-ID)        │ read header           │
                                 │ membershipFindByUser  │
                                 │   AndSpace query      │
                                 │ 400 no header         │
                                 │ 403 not member        │
                                 ▼                        ▼
                       SpaceContext.run(spaceId, () => handler)
                                 │
              Resolver ─→ CommandBus/QueryBus ─→ Handler ─→ TenantRepository
                                                              │ ctx.require()
                                                              ▼ WHERE spaceId=?

## SpaceGuard (CanActivate)

```ts
// transport — global via APP_GUARD, ordered AFTER JwtAuthGuard
canActivate(ctx): Promise<boolean> {
  if (reflector.getAllAndOverride(SKIP_SPACE_KEY, [handler, class])) return true;
  const req = this.getRequest(ctx); // dual REST/GQL like JwtAuthGuard
  const user = req.user as CurrentUserPayload;        // set by JwtAuthGuard
  const spaceId = req.headers['x-space-id'];
  if (!spaceId) throw new MissingSpaceHeaderException(); // 400 BadRequest
  const isMember = await queryBus.execute(
    new MembershipFindByUserAndSpaceQuery(user.userId, spaceId));
  if (!isMember) throw new NotASpaceMemberException();    // 403 Forbidden
  return new Promise(res =>
    this.spaceContext.run(spaceId, () => res(true)));   // ALS frame wraps rest of request
}
```
Membership check goes through `QueryBus` (no direct service injection in transport). Uses dual-context `getRequest` identical to `JwtAuthGuard`.

## SpaceContext (AsyncLocalStorage)

```ts
@Injectable() // global singleton
class SpaceContext {
  private als = new AsyncLocalStorage<{ spaceId: string }>();
  run<T>(spaceId: string, fn: () => T): T { return this.als.run({ spaceId }, fn); }
  get(): string | undefined { return this.als.getStore()?.spaceId; }
  require(): string { const s=this.get(); if(!s) throw new SpaceContextMissingException(); return s; }
}
```
Guard establishes the ALS frame via `run()` so it survives the async handler chain. (A NestJS interceptor/middleware may host `run()` if a guard-return cannot keep the frame open across the request; see Open Questions.)

## Space Aggregate + SpaceMembership child

```ts
class SpaceAggregate extends BaseAggregate {       // constructor = hydration ONLY
  static create(ownerId, name): SpaceAggregate {    // named method emits events
    const s = new SpaceAggregate({...});
    s.addMember(ownerId, MembershipRole.OWNER);     // owner membership
    s.apply(new SpaceCreatedEvent(...)); return s;
  }
  addMember(userId, role=MEMBER) {
    if (this._memberships.some(m=>m.userId===userId)) throw new DuplicateMembershipException();
    this._memberships.push(SpaceMembership.create(userId, role));
    this.apply(new MemberAddedEvent(...));
  }
  removeMember(userId) {
    if (userId===this._ownerId) throw new CannotRemoveOwnerException();
    if (!this._memberships.some(m=>m.userId===userId)) throw new NotASpaceMemberException();
    this._memberships = this._memberships.filter(m=>m.userId!==userId);
    this.apply(new MemberRemovedEvent(...));
  }
}
```
Fields — `Space`: `id, name(VO), ownerId, memberships[], createdAt, updatedAt`. `SpaceMembership` (child): `userId, role(owner|member VO), joinedAt`. Invariants: owner cannot be removed; no duplicate membership; created Space always has exactly one owner membership. Events: `SpaceCreatedEvent`, `MemberAddedEvent`, `MemberRemovedEvent`.

## TenantRepository wrapper

```ts
export function createTenantRepository<E extends { spaceId: string }>(
  repo: Repository<E>, ctx: SpaceContext): Repository<E> {
  const guard = () => ({ spaceId: ctx.require() }); // throws SpaceContextMissingException
  return new Proxy(repo, { get(t, p) {
    if (p==='findOne'||p==='find'||p==='findAndCount')
      return (o={}) => t[p]({ ...o, where: { ...o.where, ...guard() } });
    if (p==='save') return (e) => t.save({ ...e, ...guard() });
    if (p==='delete') return (c) => t.delete({ ...c, ...guard() });
    return Reflect.get(t, p);
  }});
}
```
Each tenant-scoped repo is provided via a factory that injects the raw `Repository<E>` + `SpaceContext` and returns the proxy. `UserTypeOrmWriteRepository`, `*ReadRepository`, `AccountTypeOrm*` switch from `@InjectRepository(E)` to injecting the tenant-wrapped repo. Fail-closed: any wrapped call with empty context throws before hitting the DB.

## register-account flow

    POST /register  (@SkipSpace — no Space yet)
      JwtAuthGuard: skipped (login route public)
      RegisterAccountCommandHandler.execute:
        assertEmailAvailable(spaceId?) ── email now unique per (spaceId,email)
        userId   = CreateUserCommand
        spaceId  = CreateSpaceCommand(ownerId=userId, name="<default>")  // creates Space + owner membership + cap check
        account  = build(... spaceId)        ← account written WITH spaceId
        accountWriteRepository.save(account) ← uses a NON-tenant repo here (bootstrap), OR ctx.run(spaceId)
        publishEvents(account)
      return { token }

Registration endpoint is annotated `@SkipSpace()` (and public for auth). Space creation is orchestrated INSIDE the handler via `CreateSpaceCommand` (Decision 5). During bootstrap the account/user/space writes run inside an explicit `SpaceContext.run(newSpaceId, ...)` frame so the tenant repos accept them.

## Database Schema

`spaces`: `id uuid PK, name varchar, owner_id uuid, created_at, updated_at`.
`space_memberships`: `id uuid PK, space_id uuid FK→spaces.id, user_id uuid, role varchar, joined_at`, `UNIQUE(space_id,user_id)`, `INDEX(user_id)`.
`accounts` (recreate): add `space_id uuid NOT NULL`; drop `UNIQUE(email)` → `UNIQUE(space_id,email)`; `INDEX(space_id)`.
`users` (recreate): add `space_id uuid NOT NULL`; `UNIQUE(username)` → `UNIQUE(space_id,username)`; `INDEX(space_id)`.
`auth_sessions`: **no `space_id`** (user-global; confirmed).

Migration order (alpha data discarded, fresh): `1__CreateSpaces`, `2__CreateSpaceMemberships`, `3__AddSpaceIdToAccounts`, `4__AddSpaceIdToUsers`. Each has `down()` reversing columns/indexes.

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | Space aggregate invariants; TenantRepository fail-closed; SpaceContext require() | `jest.Mocked<T>`, co-located, no `@nestjs/testing` |
| Unit | SpaceGuard 400/403/allow | mocked QueryBus + SpaceContext |
| E2E | Space A cannot read/write Space B; missing header→400; non-member→403; dup email across spaces OK | supertest |

## Open Questions

- [ ] Can a guard keep the ALS frame open for the whole request via `run()` returning a promise, or must `run()` live in a middleware/interceptor that wraps `next()`? (Decision 2 holds either way; placement to validate in apply.)
- [ ] Bootstrap writes during register: explicit `ctx.run()` vs dedicated non-tenant repos — pick one in tasks.
