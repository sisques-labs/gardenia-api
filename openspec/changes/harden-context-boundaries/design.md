# Design: Harden Bounded-Context Boundaries

## 1. Guiding principle

Cross-context communication is already modelled as **hexagonal ports**: the
consumer context owns an interface in `application/ports/`, and an adapter in
`infrastructure/adapters/` implements it by translating to/from the producer
context. The adapter is the *only* place allowed to know about another context.
This change (a) closes the handlers that still bypass that seam and (b) makes
the rule mechanically enforceable.

The dispatch mechanism stays the in-process `CommandBus` / `QueryBus`. We are
not changing *how* contexts talk today — we are guaranteeing they only talk
through a swappable seam, so a future change can replace the adapter body with
an HTTP/gRPC/message client without touching domain or application code.

## 2. ESLint enforcement — decision

### Options considered

1. **`no-restricted-imports` with path patterns** (built-in). Cannot express
   "this file's own context vs. another context" relative logic — a single
   static pattern can't know which context the importing file belongs to, so it
   can't allow same-context while forbidding cross-context. Rejected as the
   primary mechanism.
2. **`eslint-plugin-import` → `import/no-restricted-paths` with zones**. Supports
   `target`/`from`/`except`. Workable but verbose: one zone pair per
   context-to-context combination (10 contexts ≈ many zones), and `except` is
   path-based so the adapter exception must be repeated per zone.
3. **`eslint-plugin-boundaries`** (purpose-built). Define element types by
   folder convention (context + layer), then declare allowed dependencies
   declaratively, including "only `adapters` elements may depend on a foreign
   context". Cleanest fit for a per-context rule with one adapter exception.

### Decision

Use **`eslint-plugin-boundaries`** as the primary mechanism, complemented by a
small `no-restricted-imports` allowlist note for the auth transversal paths.

Rationale: the rule we need is inherently relative ("a context may not import
another context's internals unless the importing file is an adapter"), which is
exactly what element-type rules express. It scales to all 11 contexts with a
single rule block instead of N² zones.

### Configuration sketch

Element types keyed off the existing folder layout:

```
settings['boundaries/elements'] = [
  { type: 'adapter',    pattern: 'src/contexts/*/infrastructure/adapters/**' },
  { type: 'context',    pattern: 'src/contexts/*/**', capture: ['contextName'] },
]
```

Rule intent (`boundaries/element-types`):
- An `adapter` element MAY import any `@contexts/**`.
- A non-adapter `context` element MAY import `@contexts/${contextName}/**`
  (its own context) only.
- Allowlist (escape hatch) for the auth transversal infra, expressed via
  `boundaries/no-private` / an `allow` entry or a parallel
  `no-restricted-imports` override:
  - `@contexts/auth/infrastructure/guards/jwt-auth*`
  - `@contexts/auth/infrastructure/decorators/current-user*`
  - `@contexts/auth/domain/enums/app-role*`

Spec files (`*.spec.ts`) are linted the same way — adapter specs already import
foreign queries and live under `adapters/`, so they pass.

> Exact rule syntax is finalised during apply; the verification step (Task 1.3)
> requires that the rule flags every baseline violation before refactoring and
> passes on adapters + allowlist.

## 3. Port/adapter designs

### 3.1 auth → users / spaces

Today `register-account`, `login-with-oauth` and `delete-account` handlers
inject `CommandBus` and dispatch foreign commands directly. Two new ports in
`src/contexts/auth/application/ports/`:

```
IUserProvisioningPort   { createUser(input): Promise<void>; deleteUser(userId): Promise<void> }
ISpaceProvisioningPort  { createDefaultSpace(input): Promise<string> }
```

Adapters in `src/contexts/auth/infrastructure/adapters/`:

```
UserProvisioningAdapter   → commandBus.execute(new CreateUserCommand(...) | new DeleteUserCommand(...))
SpaceProvisioningAdapter  → commandBus.execute(new CreateSpaceCommand(...))
```

Handlers depend on the port tokens (`USER_PROVISIONING_PORT`,
`SPACE_PROVISIONING_PORT`) via `@Inject`, never on the foreign command classes.

**DI cycle note**: adapters dispatch via `CommandBus`, which is global
(`CqrsModule.forRoot()`); they do NOT import `UsersModule`/`SpacesModule`. The
port tokens are bound only in `AuthModule`. No new module-import edges are
created, so there is no `auth ↔ users/spaces` module cycle.

```
sequenceDiagram
  participant H as RegisterAccountHandler (auth)
  participant UP as IUserProvisioningPort
  participant SP as ISpaceProvisioningPort
  participant Bus as CommandBus
  H->>UP: createUser(input)
  UP->>Bus: execute(CreateUserCommand)
  H->>SP: createDefaultSpace(input)
  SP->>Bus: execute(CreateSpaceCommand)
  Note over H: handler has zero @contexts/users|spaces imports
```

### 3.2 plants → qr (write)

Extend the existing `IPlantQrPort` rather than adding a second port (it already
owns the plant↔qr seam for reads):

```
IPlantQrPort {
  findByQrId(qrId): Promise<PlantQrViewModel | null>   // unchanged
  createForPlant(input: { targetUrl; spaceId }): Promise<string>   // new
  delete(qrId): Promise<void>                                       // new
}
```

`PlantQrAdapter` gains the two methods, dispatching `CreateQrCommand` /
`DeleteQrCommand` via `CommandBus`. `create-plant.handler` keeps using
`PlantQrTargetUrlBuilderService` to build the URL (that is plants-owned logic),
then calls `port.createForPlant({ targetUrl, spaceId })` instead of dispatching
`CreateQrCommand`. `delete-plant.handler` calls `port.delete(qrId)`.

### 3.3 spaces → weather (local type)

Introduce a spaces-owned forecast interface (primitives shape) so the port
contract no longer leaks `@contexts/weather`:

```
// spaces/application/ports/space-weather.port.ts (or domain/interfaces)
interface ISpaceWeatherForecast { /* same fields as IWeatherForecast, spaces-owned */ }
interface ISpaceWeatherPort { getForecast(lat, lon): Promise<ISpaceWeatherForecast> }
```

`SpaceWeatherAdapter` maps weather's `IWeatherForecast` → `ISpaceWeatherForecast`
(field copy; identical values). `get-space-weather.handler` references only
`ISpaceWeatherForecast`.

## 4. Testing strategy

- **Unit**: new adapters (`jest.Mocked<CommandBus>`), asserting they dispatch the
  correct command instance with the correct payload (mirrors the existing
  `plant-qr.adapter.spec.ts` / `planting-spot.adapter.spec.ts` pattern).
  Updated handlers re-tested against the port mock instead of the bus.
- **E2E** (behaviour-preservation): register account, OAuth login (new-user
  branch that provisions space), delete account, create plant (asserts QR
  created), delete plant (asserts QR removed), get space weather. These prove
  the refactor changed no observable behaviour.
- **Lint regression**: a throwaway fixture importing a foreign context's
  application layer from a non-adapter file must make `pnpm lint` fail; removing
  it makes lint pass.

## 5. Apply order

Land the refactors first (so the tree is clean), then turn on the ESLint rule
last — enabling the rule on an already-clean tree avoids a giant mixed commit
and gives a clear "rule flips green" checkpoint. Within the refactors, do the
smallest blast-radius first: spaces/weather type → plants/qr write → auth
provisioning.
