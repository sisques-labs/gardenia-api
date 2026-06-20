# Spec: Context Boundaries — change `harden-context-boundaries`

Cross-cutting structural requirements. No domain data or schema changes.

---

## 1. Boundary Rule

### 1.1 Allowed cross-context surface

A file in context `A` MUST NOT import from `@contexts/B/domain/**`,
`@contexts/B/application/**`, or `@contexts/B/transport/**` (where `B != A`),
**except**:

1. Files located in `src/contexts/A/infrastructure/adapters/**` — adapters ARE
   the seam and MAY import another context's `application` (commands/queries)
   and `domain` (view-models/interfaces) to translate them.
2. The auth transversal allowlist (cross-cutting authentication infrastructure):
   - `@contexts/auth/infrastructure/guards/jwt-auth*`
   - `@contexts/auth/infrastructure/decorators/current-user*`
   - `@contexts/auth/domain/enums/app-role*`

Same-context imports (`@contexts/A/**` from a file in `A`) are always allowed.

### 1.2 Enforcement

- The rule MUST be enforced by ESLint such that `pnpm lint` exits non-zero when
  a violation is present.
- The rule MUST flag each of the baseline violations listed in the proposal
  *before* they are refactored (used as a verification fixture).
- The rule MUST NOT flag adapters or allowlisted auth imports.

#### Scenario: new violation is rejected

- **Given** a handler in `src/contexts/harvests/application/`
- **When** it adds `import { X } from '@contexts/plants/application/...'`
- **Then** `pnpm lint` MUST fail with the boundary error message

#### Scenario: adapter import is allowed

- **Given** a file in `src/contexts/plants/infrastructure/adapters/`
- **When** it imports `@contexts/qr/application/commands/...`
- **Then** `pnpm lint` MUST pass

#### Scenario: auth transversal import is allowed

- **Given** any resolver or controller in any context
- **When** it imports `@contexts/auth/infrastructure/guards/jwt-auth.guard`
- **Then** `pnpm lint` MUST pass

---

## 2. auth → users / spaces provisioning ports

### 2.1 IUserProvisioningPort (auth/application/ports)

MUST expose:
- `createUser(input): Promise<void>` — equivalent of today's `CreateUserCommand`
  dispatch.
- `deleteUser(userId: string): Promise<void>` — equivalent of `DeleteUserCommand`.

Token: `USER_PROVISIONING_PORT` (Symbol). Implemented by an adapter in
`auth/infrastructure/adapters/` that dispatches the corresponding `users`
command via `CommandBus`.

### 2.2 ISpaceProvisioningPort (auth/application/ports)

MUST expose:
- `createDefaultSpace(input): Promise<string>` — equivalent of today's
  `CreateSpaceCommand` dispatch; returns the created space id if the current
  flow uses it.

Token: `SPACE_PROVISIONING_PORT` (Symbol). Adapter in
`auth/infrastructure/adapters/` dispatches `CreateSpaceCommand`.

#### Scenario: registering an account provisions user + space via ports

- **Given** a valid registration request
- **When** `register-account.handler` runs
- **Then** it MUST call `IUserProvisioningPort.createUser` and
  `ISpaceProvisioningPort.createDefaultSpace`
- **And** it MUST NOT import `@contexts/users/**` or `@contexts/spaces/**`
- **And** the persisted user, account and space MUST be identical to today's

#### Scenario: deleting an account removes the user via port

- **Given** an existing account
- **When** `delete-account.handler` runs
- **Then** it MUST call `IUserProvisioningPort.deleteUser`
- **And** it MUST NOT import `@contexts/users/**`

---

## 3. plants → qr write port

### 3.1 IPlantQrPort additions

The existing `IPlantQrPort` MUST be extended with write operations:
- `createForPlant(input: { targetUrl: string; spaceId: string }): Promise<string>`
  — returns the new QR id (replaces direct `CreateQrCommand` dispatch).
- `delete(qrId: string): Promise<void>` — replaces direct `DeleteQrCommand`
  dispatch.

`PlantQrAdapter` MUST implement these by dispatching `CreateQrCommand` /
`DeleteQrCommand` via `CommandBus`. The existing `findByQrId` read behaviour is
unchanged.

#### Scenario: creating a plant creates its QR through the port

- **Given** a valid create-plant request
- **When** `create-plant.handler` runs
- **Then** it MUST obtain the QR id via `IPlantQrPort.createForPlant`
- **And** it MUST NOT import `@contexts/qr/**`
- **And** the created QR MUST be identical to today's (same target URL, space)

#### Scenario: deleting a plant deletes its QR through the port

- **Given** a plant with an associated QR
- **When** `delete-plant.handler` runs
- **Then** it MUST delete the QR via `IPlantQrPort.delete`
- **And** it MUST NOT import `@contexts/qr/**`

---

## 4. spaces → weather: local forecast type

### 4.1 spaces-local forecast type

`spaces` MUST define its own forecast shape (e.g. `ISpaceWeatherForecast` in
`spaces/application/ports/` or `spaces/domain/interfaces/`). `ISpaceWeatherPort`
MUST return this local type, NOT `@contexts/weather`'s `IWeatherForecast`.

`SpaceWeatherAdapter` MUST map weather's `IWeatherForecast` onto the local type.
`get-space-weather.handler` MUST reference only the spaces-local type and MUST
NOT import `@contexts/weather/**`.

#### Scenario: space weather query has no weather import

- **Given** the get-space-weather flow
- **When** a forecast is requested for a space
- **Then** the returned forecast data MUST be identical to today's
- **And** neither the port nor the handler MUST import `@contexts/weather/**`
- **And** only `SpaceWeatherAdapter` may import `@contexts/weather/**`
