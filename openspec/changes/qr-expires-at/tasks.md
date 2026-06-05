# Tasks: QR Expiration Field

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200–300 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-PR |

---

## PR 1: `qr` bounded context — domain, application, infrastructure, transport

### 1.1 Domain layer

- [x] 1.1 Create `QrExpiresAtValueObject` at `src/contexts/qr/domain/value-objects/qr-expires-at/qr-expires-at.value-object.ts`
  - Wraps `Date | null`; no validation in constructor — validation lives in `CreateQrCommand`
  - Does NOT extend a kit base class (no nullable date VO in kit)
- [x] 1.2 Create `QrExpiredError` at `src/contexts/qr/domain/exceptions/qr-expired.error.ts`
  - Extends `BaseException`; registered in `src/contexts/qr/transport/exceptions/qr-exception.filter.ts` → HTTP 410
- [x] 1.3 Update `IQr` interface: add `expiresAt: QrExpiresAtValueObject | null`
- [x] 1.4 Update `IQrPrimitives`: add `expiresAt: Date | null`
- [x] 1.5 Update `QrAggregate`:
  - Add private `_expiresAt: QrExpiresAtValueObject | null` field
  - Add `expiresAt` getter
  - Add `isExpired(): boolean` method (`_expiresAt !== null && _expiresAt.value! < new Date()`)
  - Update `toPrimitives()` to include `expiresAt`
- [x] 1.6 Update `QrViewModel`: add `expiresAt: Date | null`

### 1.2 Application layer

- [x] 1.7 Update `CreateQrCommandInput` and `CreateQrCommand`:
  - Add `expiresAt?: Date` to input interface
  - Validate `expiresAt <= new Date()` throws in command constructor (creation-time constraint)
  - Wrap as `new QrExpiresAtValueObject(input.expiresAt)` when present
- [x] 1.8 Update `CreateQrCommandHandler`: pass `expiresAt` from command to `QrBuilder`
- [x] 1.9 Update `QrBuilder`: add `withExpiresAt(value: Date | null): this` method
- [x] 1.10 Create `AssertQrNotExpiredService` at `src/contexts/qr/application/services/read/assert-qr-not-expired/assert-qr-not-expired.service.ts`
- [x] 1.11 Update `QrFindByIdQueryHandler`: after `assertQrViewModelExists`, call `assertQrNotExpired.execute(viewModel)`
- [x] 1.12 Update `QrFindPngByIdQueryHandler`: same as 1.11 (assert not expired before returning PNG)
- [x] 1.13 Register `AssertQrNotExpiredService` in `qr.module.ts` (add to `APPLICATION_SERVICES` array)

### 1.3 Infrastructure layer

- [x] 1.14 Update `QrTypeOrmEntity`: add `@Column({ name: 'expires_at', type: 'timestamp', nullable: true }) expiresAt!: Date | null`
- [x] 1.15 Update `QrTypeOrmMapper`:
  - `toAggregate`: pass `entity.expiresAt` to builder's `withExpiresAt()`
  - `toEntity`: set `entity.expiresAt = primitives.expiresAt`
  - `toViewModel`: include `expiresAt: entity.expiresAt`
- [x] 1.16 Create migration `1780000000012-AddExpiresAtToQrs.ts`:
  - `up`: `ALTER TABLE qrs ADD COLUMN expires_at TIMESTAMPTZ NULL`
  - `down`: `ALTER TABLE qrs DROP COLUMN expires_at`

### 1.4 Transport layer

- [x] 1.17 Update REST `QrRestResponseDto`: add `expiresAt: Date | null` with `@ApiProperty({ nullable: true, required: false, type: Date })`
- [ ] 1.18 Update REST create/request DTO: no public POST /qrs REST endpoint exists; `expiresAt` is set internally via `CreateQrCommand` (e.g. from plants flow). Skip unless a direct REST creation endpoint is added.
- [x] 1.19 Update `QrResponseDto` (GraphQL): add `@Field(() => Date, { nullable: true }) expiresAt!: Date | null`
- [x] 1.20 Update `QrGraphQLMapper`: map `expiresAt`
- [x] 1.21 Update `QrRestMapper`: map `expiresAt`

### 1.5 Tests

- [x] 1.22 Unit test `QrExpiresAtValueObject`: wraps date, null, past date without throwing
- [x] 1.22b Unit test `CreateQrCommand`: past date throws; future date accepted; null accepted
- [x] 1.23 Unit test `QrAggregate`: `isExpired()` returns correct boolean for null, past, and future dates
- [x] 1.24 Unit test `AssertQrNotExpiredService`: expired VM throws `QrExpiredError`; non-expired passes
- [x] 1.25 Unit test `CreateQrCommandHandler`: `expiresAt` is passed to builder when provided; null when absent
- [x] 1.26 `QrFindByIdQueryHandler` unit test: expired QR → `QrExpiredError`; non-expired → ViewModel
- [x] 1.27 `QrFindPngByIdQueryHandler` unit test: expired QR → `QrExpiredError`
- [x] 1.28 `QrBuilder` unit tests: `expiresAt` round-trips correctly (null, future, past)
- [x] 1.28b Mapper unit tests (`QrRestMapper`, `QrGraphQLMapper`): `expiresAt` mapped correctly
- [ ] 1.29 Integration spec (`test/integration/qr/`): persist QR with and without `expiresAt`; verify round-trip
- [ ] 1.30 E2E spec: GET `/api/qrs/:id` returns `expiresAt` in response; expired QR returns 410

---

## Post-MVP (not in this change)

- [ ] `UpdateQrExpiresAt` command + endpoint for mutating expiry after creation
- [ ] Background job to clean up long-expired QRs
- [ ] Expiry enforcement on scan-redirect proxy (if public endpoint added later)
- [ ] Integration + E2E tests for expiry enforcement (requires DB)
