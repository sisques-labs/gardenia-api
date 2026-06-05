# Design: QR Expiration Field (`qr` bounded context)

> Technical design for adding `expiresAt` to `QrAggregate`. All changes are scoped to the `qr` bounded context. No cross-context wiring required.

---

## Context

- `QrAggregate` currently holds: `id`, `spaceId`, `targetUrl`, `generation`, `createdAt`, `updatedAt`.
- `expiresAt` follows the same nullable-date pattern already used in the `auth` context (`revokedAt: Date | null` on `AuthSessionEntity`).
- Enforcement (returning 410 on expired QRs) is a **read concern** — checked in query handlers before returning the view model, not encoded in write-side logic.

---

## Goals / Non-Goals

**Goals:**

- `expiresAt: Date | null` on aggregate, primitives, view model, entity, and all transport DTOs.
- `QrExpiresAtValueObject` with future-date validation.
- `QrExpiredError` domain error → HTTP 410 in REST, domain error in GraphQL.
- Expiry enforcement in `QrFindByIdQueryHandler` and `QrFindPngByIdQueryHandler`.
- New `AssertQrNotExpiredService` read-side assert service (mirrors `AssertQrViewModelExistsService` pattern).
- Nullable DB column `expires_at TIMESTAMPTZ`; safe migration (existing rows → NULL).

**Non-Goals:**

- Mutable `expiresAt` after creation.
- Auto-deletion or soft-delete of expired QRs.
- Enforcement on `RegenerateQrCommand`.
- Any change to the `plants` context.

---

## Decisions

### ADR-1: Immutability of `expiresAt`

**Decision:** `expiresAt` is set once in `CreateQrCommand` and never modified.

**Rationale:** Simplest model; a separate `UpdateQrExpiresAt` command can be added in a follow-up change if needed. Avoids audit complexity for now.

---

### ADR-2: Enforcement in query handlers, not aggregate methods

**Decision:** Expiry is checked by `AssertQrNotExpiredService` (called from `QrFindByIdQueryHandler` and `QrFindPngByIdQueryHandler`), not inside `QrAggregate`.

**Rationale:** Enforcement is a **read concern** driven by wall-clock time. The aggregate `isExpired()` method provides the predicate; the application service decides when to enforce it. Write-side commands (`Regenerate`, `Delete`) are not blocked — regenerating an expired QR is a valid admin action.

**Flow for `QrFindByIdQueryHandler`:**

```text
1. assertQrViewModelExists.execute(qrId)  → QrViewModel (or 404)
2. assertQrNotExpired.execute(viewModel)  → void (or 410)
3. return viewModel
```

---

### ADR-3: `QrExpiresAtValueObject` validates future-date at construction

**Decision:** `QrExpiresAtValueObject` wraps `Date | null`. When a `Date` is provided, it MUST be strictly greater than `new Date()` at construction time.

**Rationale:** Rejects clearly invalid input early, at the domain boundary. Consistent with value object validation patterns in the codebase (e.g. `QrTargetUrlValueObject` enforces max length).

**Consequence:** A QR that was valid at creation time may expire later — `QrExpiresAtValueObject` construction of an existing date from persistence does NOT re-validate (hydration path bypasses validation, same as all other VOs built from DB data via `QrBuilder`).

---

### ADR-4: HTTP 410 Gone for expired QRs

**Decision:** `QrExpiredError` maps to HTTP 410 Gone. Registered in `base-exception.filter.ts` alongside `QrNotFoundException`.

**Rationale:** 410 is the semantic HTTP code for a resource that previously existed but is no longer available — semantically correct for expired QRs that still exist in DB but are functionally unavailable.

---

### ADR-5: `QrAggregate.isExpired()` as the predicate

**Decision:** Add `isExpired(): boolean` on `QrAggregate`. Returns `true` if `expiresAt` is non-null and `expiresAt.value < new Date()`.

**Rationale:** Encapsulates expiry logic in the aggregate (single source of truth), while leaving enforcement to the application layer. No ViewModel equivalent — the assert service works from the view model's raw `expiresAt: Date | null`.

---

## Domain Layer

### `QrExpiresAtValueObject`

```typescript
// domain/value-objects/qr-expires-at.value-object.ts
export class QrExpiresAtValueObject {
  readonly value: Date | null;

  constructor(value: Date | null) {
    if (value !== null && value <= new Date()) {
      throw new Error('expiresAt must be a future date');
    }
    this.value = value;
  }
}
```

> **Note:** Does NOT extend a kit base class — there is no `NullableDateValueObject` in the kit; implement directly. Hydration from persistence passes the stored date without re-validation (same pattern as all builders).

### `QrAggregate` changes

| Member | Change |
|--------|--------|
| `_expiresAt: QrExpiresAtValueObject \| null` | New private field |
| `expiresAt` getter | Returns `_expiresAt` |
| `isExpired(): boolean` | `_expiresAt !== null && _expiresAt.value! < new Date()` |
| `toPrimitives()` | Include `expiresAt: _expiresAt?.value ?? null` |

### `IQr` interface

```typescript
expiresAt: QrExpiresAtValueObject | null;
```

### `IQrPrimitives` / `QrViewModel`

```typescript
expiresAt: Date | null;
```

### `QrExpiredError`

```typescript
// domain/exceptions/qr-expired.error.ts
export class QrExpiredError extends Error {}
```

Register in `base-exception.filter.ts` → HTTP 410.

---

## Application Layer

### `CreateQrCommand`

Add `expiresAt?: Date` to `CreateQrCommandInput`. Command constructor wraps it:

```typescript
this.expiresAt = input.expiresAt
  ? new QrExpiresAtValueObject(input.expiresAt)
  : null;
```

`CreateQrCommandHandler` passes `expiresAt` to `QrBuilder`.

### `QrBuilder`

Add `expiresAt(value: Date | null): this` method — stores as `QrExpiresAtValueObject` (no validation on hydration path; use direct construction).

### `AssertQrNotExpiredService` (read-side)

```
src/contexts/qr/application/services/read/assert-qr-not-expired.service.ts
```

```typescript
execute(viewModel: QrViewModel): void {
  if (viewModel.expiresAt !== null && viewModel.expiresAt < new Date()) {
    throw new QrExpiredError();
  }
}
```

Called from `QrFindByIdQueryHandler` and `QrFindPngByIdQueryHandler` after the view model is confirmed to exist.

---

## Infrastructure Layer

### `QrTypeOrmEntity`

```typescript
@Column({ name: 'expires_at', type: 'timestamp', nullable: true })
expiresAt!: Date | null;
```

### `QrTypeOrmMapper`

- `toAggregate`: read `entity.expiresAt` → pass to builder as-is (no VO construction with validation).
- `toEntity`: `entity.expiresAt = aggregate.toPrimitives().expiresAt`.
- `toViewModel`: `expiresAt: entity.expiresAt`.

### Migration: `AddExpiresAtToQrs`

```sql
-- up
ALTER TABLE qrs ADD COLUMN expires_at TIMESTAMPTZ NULL;

-- down
ALTER TABLE qrs DROP COLUMN expires_at;
```

Naming: `{timestamp}-AddExpiresAtToQrs.ts`. Timestamp must be higher than existing migrations.

---

## Transport Layer

### REST

- `QrRestResponseDto`: add `expiresAt: Date | null`; annotate `@ApiProperty({ nullable: true, required: false })`.
- `QrsController` create endpoint: accept `expiresAt?: string` (ISO) in request body DTO → parse to `Date | null` → `CreateQrCommand`.
- Error mapping in `base-exception.filter.ts`: `QrExpiredError` → 410.

### GraphQL

- `QrResponseDto`: add `@Field(() => Date, { nullable: true }) expiresAt?: Date`.
- `QrGraphQLMapper`: map `expiresAt`.
- `CreateQr` GraphQL mutation input (if exposed): add optional `expiresAt: Date`.

---

## File Tree (new + modified)

```
src/contexts/qr/domain/
  value-objects/qr-expires-at.value-object.ts    (new)
  exceptions/qr-expired.error.ts                 (new)
  interfaces/qr.interface.ts                     (+ expiresAt)
  interfaces/qr.primitives.ts                    (+ expiresAt)
  aggregates/qr.aggregate.ts                     (+ expiresAt, isExpired)
  view-models/qr.view-model.ts                   (+ expiresAt)

src/contexts/qr/application/
  commands/create-qr/create-qr.command.ts        (+ expiresAt input)
  commands/create-qr/create-qr.handler.ts        (pass expiresAt to builder)
  services/read/assert-qr-not-expired.service.ts (new)
  queries/qr-find-by-id/qr-find-by-id.handler.ts (+ assert not expired)
  queries/qr-find-png-by-id/qr-find-png-by-id.handler.ts (+ assert not expired)

src/contexts/qr/infrastructure/persistence/typeorm/
  entities/qr.entity.ts                          (+ expires_at column)
  mappers/qr.mapper.ts                           (+ expiresAt mapping)

src/contexts/qr/infrastructure/builders/
  qr.builder.ts                                  (+ expiresAt method)

src/contexts/qr/transport/
  rest/dtos/qr-rest-response.dto.ts              (+ expiresAt)
  rest/dtos/create-qr-rest-request.dto.ts        (+ expiresAt optional)
  graphql/dtos/qr-response.dto.ts                (+ expiresAt field)
  graphql/mappers/qr.graphql.mapper.ts           (+ expiresAt)

src/database/migrations/
  {timestamp}-AddExpiresAtToQrs.ts               (new)

src/core/filters/base-exception.filter.ts        (+ QrExpiredError → 410)
```

---

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Clock skew between app instances | Acceptable for MVP; expiry is best-effort, not cryptographic |
| Validation rejects dates that are "just expired" at construction | Use `<=` (not `<`) for strict future: `value <= new Date()` throws |
| Hydration path must not re-validate | Builder uses raw constructor without validation (same pattern as all VOs from DB) |
| Existing QRs get `expiresAt: null` | Safe — null means never expires, which is the correct semantic for all pre-existing rows |
