# Tasks: Harden Bounded-Context Boundaries

Order: refactor seams first (smallest blast radius first), enable the ESLint
rule last on an already-clean tree. Each phase is independently committable and
keeps `pnpm test` / `pnpm build` green.

## Phase 0 — Baseline & guardrail

- [ ] 0.1 Record the baseline violation set (the 7 imports from the proposal) as
      the lint-rule fixture target.
- [ ] 0.2 Add `eslint-plugin-boundaries` to devDependencies (`pnpm add -D
      eslint-plugin-boundaries`). Do NOT enable the rule yet.
- [ ] 0.3 Confirm `pnpm test`, `pnpm build`, `pnpm lint` are green before any
      change.

## Phase 1 — spaces → weather: local forecast type

- [ ] 1.1 Add spaces-owned `ISpaceWeatherForecast` interface (spaces-local,
      same fields as `IWeatherForecast`).
- [ ] 1.2 Change `ISpaceWeatherPort.getForecast` to return
      `ISpaceWeatherForecast`; remove the `@contexts/weather` import from the
      port.
- [ ] 1.3 Update `SpaceWeatherAdapter` to map `IWeatherForecast` →
      `ISpaceWeatherForecast` (the adapter keeps the only weather import).
- [ ] 1.4 Update `get-space-weather.handler.ts` to use `ISpaceWeatherForecast`;
      remove its `@contexts/weather` import.
- [ ] 1.5 Update/adjust unit specs for the adapter and handler.
- [ ] 1.6 `pnpm test` + `pnpm build` green; commit.

## Phase 2 — plants → qr: write port

- [ ] 2.1 Extend `IPlantQrPort` with `createForPlant({ targetUrl, spaceId })` and
      `delete(qrId)`.
- [ ] 2.2 Implement both in `PlantQrAdapter` via `CommandBus`
      (`CreateQrCommand` / `DeleteQrCommand`); add Logger entries per
      conventions.
- [ ] 2.3 Refactor `create-plant.handler.ts`: keep
      `PlantQrTargetUrlBuilderService`, replace the `CreateQrCommand` dispatch
      with `port.createForPlant(...)`; remove the `@contexts/qr` import.
- [ ] 2.4 Refactor `delete-plant.handler.ts`: replace `DeleteQrCommand` dispatch
      with `port.delete(qrId)`; remove the `@contexts/qr` import.
- [ ] 2.5 Update unit specs: extend `plant-qr.adapter.spec.ts`; update the two
      handler specs to assert against the port mock.
- [ ] 2.6 `pnpm test` + `pnpm build` green; commit.

## Phase 3 — auth → users / spaces: provisioning ports

- [ ] 3.1 Add `IUserProvisioningPort` (`createUser`, `deleteUser`) +
      `USER_PROVISIONING_PORT` token in `auth/application/ports/`.
- [ ] 3.2 Add `ISpaceProvisioningPort` (`createDefaultSpace`) +
      `SPACE_PROVISIONING_PORT` token.
- [ ] 3.3 Implement `UserProvisioningAdapter` and `SpaceProvisioningAdapter` in
      `auth/infrastructure/adapters/` (dispatch `CreateUserCommand` /
      `DeleteUserCommand` / `CreateSpaceCommand` via `CommandBus`).
- [ ] 3.4 Bind the port tokens in `AuthModule`
      (`useClass`, grouped under an `ADAPTERS`/`INFRASTRUCTURE_*` const array).
- [ ] 3.5 Refactor `register-account.handler.ts` to use both ports; remove
      `@contexts/users` and `@contexts/spaces` imports.
- [ ] 3.6 Refactor `login-with-oauth.handler.ts` likewise.
- [ ] 3.7 Refactor `delete-account.handler.ts` to use
      `IUserProvisioningPort.deleteUser`; remove `@contexts/users` import.
- [ ] 3.8 Update unit specs for the three handlers (port mocks) and add adapter
      specs.
- [ ] 3.9 `pnpm test` + `pnpm build` green; commit.

## Phase 4 — Enable the ESLint boundary rule

- [ ] 4.1 Add `boundaries/elements` settings (adapter + context element types)
      and the `boundaries/element-types` rule to `.eslintrc.js`.
- [ ] 4.2 Add the auth transversal allowlist (jwt-auth guard, current-user
      decorator, app-role enum).
- [ ] 4.3 Verify: temporarily reintroduce one baseline violation → `pnpm lint`
      fails with the boundary message; remove it → `pnpm lint` passes.
- [ ] 4.4 Run `pnpm lint` across the whole tree; resolve any remaining flagged
      imports (or add to allowlist with justification).
- [ ] 4.5 Commit.

## Phase 5 — Verification & docs

- [ ] 5.1 E2E (behaviour-preservation): register, OAuth login (provisioning
      branch), delete account, create plant (QR created), delete plant (QR
      removed), get space weather. All green.
- [ ] 5.2 `pnpm test:cov` ≥ 80% on touched files.
- [ ] 5.3 Update `src/contexts/auth/README.md`, `src/contexts/plants/README.md`,
      `src/contexts/spaces/README.md` to document the new ports.
- [ ] 5.4 Final `pnpm lint` + `pnpm build` + full test suites green.
