# Proposal: Harden Bounded-Context Boundaries

> Tracks GitHub issue #258.

## Intent

The API is a modular monolith with eleven bounded contexts. As a first,
risk-free step toward an eventual split into microservices, we want every
cross-context interaction to flow through a **port (`application/ports/`) +
adapter (`infrastructure/adapters/`)** — the anti-corruption seam that
`plants`, `weather`, `plant-species`, `planting-spots` and `spaces` already use
for most of their interactions — and we want that rule **enforced by the
linter**, not by reviewer discipline.

Why now: the port/adapter pattern is already the de-facto standard in this
codebase (11 ports, 12 adapters today). A handful of handlers still reach
directly into another context's `application`/`domain` layer. Closing those
gaps and locking the boundary with an ESLint rule means that migrating any
context to a standalone service later becomes a change to the *adapter
implementation only* (swap `QueryBus`/`CommandBus` for HTTP or messaging) —
domain and application layers stay untouched.

Success looks like: there are **zero** direct imports of another context's
`domain`/`application`/`transport` internals outside that consumer's own
`infrastructure/adapters/` directory (plus a small, explicit allowlist for
auth's transversal infrastructure), and `pnpm lint` fails if a new violation is
introduced.

## Scope

### In Scope

- **auth → users / spaces**: `register-account` and `login-with-oauth` handlers
  dispatch `CreateUserCommand` + `CreateSpaceCommand`; `delete-account`
  dispatches `DeleteUserCommand`. Introduce ports in
  `auth/application/ports/` (e.g. `IUserProvisioningPort`,
  `ISpaceProvisioningPort`) with adapters in `auth/infrastructure/adapters/`
  that wrap the `CommandBus` calls. Handlers depend on the port interface only.
- **plants → qr (write side)**: extend the existing `IPlantQrPort` with write
  operations (`createForPlant`, `delete`) and move the `CreateQrCommand` /
  `DeleteQrCommand` dispatch out of `create-plant.handler.ts` /
  `delete-plant.handler.ts` into `PlantQrAdapter`.
- **spaces → weather (leaky port type)**: `ISpaceWeatherPort` currently returns
  weather's `IWeatherForecast`. Define a spaces-local forecast type; the port
  returns the local type and the adapter maps weather's view onto it. Remove the
  `@contexts/weather` import from `get-space-weather.handler.ts`.
- **ESLint boundary rule**: add a lint rule that forbids importing
  `@contexts/{other}/domain|application|transport/**` from any file that is not
  in the consumer context's `infrastructure/adapters/`, with an explicit
  allowlist for auth's transversal infrastructure (JWT guard, `@CurrentUser`
  decorator, `app-role` enum).
- Update the affected contexts' `README.md` (auth, plants, spaces) to document
  the new ports.
- Tests at the applicable layers (unit for new adapters/handlers; e2e to prove
  behaviour is unchanged for register, oauth login, delete account, plant
  create/delete, space weather).

### Out of Scope (explicit)

- **Physical separation** into deployable services, per-service databases,
  asynchronous messaging / integration events, and GraphQL federation. These
  are later steps and are NOT touched here.
- The transversal **auth** dependency (JWT guard, `@CurrentUser`, `app-role`)
  is treated as shared cross-cutting infrastructure and stays an allowed import
  — it is NOT refactored into a port in this change.
- Extracting auth/tenancy into shared libraries/packages.
- Any behavioural change. This change is a pure structural refactor: the same
  commands run, the same data is written, the same responses are returned.

## Current Violations (baseline)

Direct cross-context imports outside an adapter, excluding the auth transversal
allowlist:

| Consumer file | Imports directly | Target seam |
|---------------|------------------|-------------|
| `auth/.../register-account.handler.ts` | `users` `CreateUserCommand`, `spaces` `CreateSpaceCommand` | port + adapter |
| `auth/.../oauth/login-with-oauth.handler.ts` | `users` `CreateUserCommand`, `spaces` `CreateSpaceCommand` | port + adapter |
| `auth/.../delete-account.handler.ts` | `users` `DeleteUserCommand` | port + adapter |
| `plants/.../create-plant.handler.ts` | `qr` `CreateQrCommand` | extend `IPlantQrPort` (write) |
| `plants/.../delete-plant.handler.ts` | `qr` `DeleteQrCommand` | extend `IPlantQrPort` (write) |
| `spaces/application/ports/space-weather.port.ts` | `weather` `IWeatherForecast` (return type) | spaces-local type |
| `spaces/.../get-space-weather.handler.ts` | `weather` `IWeatherForecast` | spaces-local type |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Behavioural regression in register / oauth / delete-account flows (these orchestrate multiple contexts) | Med | High | Keep adapter logic a 1:1 move of the existing dispatch; cover with e2e before/after |
| ESLint rule too strict — breaks legitimate same-context or allowlisted imports | Med | Med | Scope rule to cross-context only; explicit auth allowlist; run `pnpm lint` on whole tree before commit |
| ESLint rule too loose — misses a violation pattern | Med | Med | Add a regression test/fixture; verify the rule flags each baseline violation before the refactor removes them |
| Adapter introduces a new DI cycle (auth ↔ users/spaces modules) | Low | Med | Adapters dispatch via `CommandBus` (no module import of the other context); bind port token in the auth module only |

## Rollback Plan

The change is structural and additive (new ports/adapters + an ESLint rule);
the only edits to existing files are swapping a direct dispatch for a port call
and relaxing the leaky type. Rollback = revert the branch. No migrations, no
schema changes, no data impact. The ESLint rule can be disabled independently by
reverting the `.eslintrc.js` change if it proves too noisy.

## Success Criteria

- [ ] Zero direct cross-context `domain`/`application`/`transport` imports
      outside `infrastructure/adapters/`, except the auth transversal allowlist.
- [ ] New ports: auth user-provisioning, auth space-provisioning, plant-qr
      write ops; spaces-local weather forecast type.
- [ ] `pnpm lint` fails when a fresh violation is introduced (verified with a
      throwaway fixture).
- [ ] register / oauth-login / delete-account / plant-create / plant-delete /
      space-weather behave identically (e2e green).
- [ ] READMEs for auth, plants, spaces updated.
- [ ] Unit + e2e green; coverage ≥ 80%.
