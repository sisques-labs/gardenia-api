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

- [ ] 1.1 Create `QrExpiresAtValueObject` at `src/contexts/qr/domain/value-objects/qr-expires-at.value-object.ts`
  - Wraps `Date | null`; throws if provided value is `<= new Date()` (must be strictly future)
  - Does NOT extend a kit base class (no nullable date VO in kit)
- [ ] 1.2 Create `QrExpiredError` at `src/contexts/qr/domain/exceptions/qr-expired.error.ts`
  - Extends `Error`; register in `src/core/filters/base-exception.filter.ts` → HTTP 410
- [ ] 1.3 Update `IQr` interface: add `expiresAt: QrExpiresAtValueObject | null`
- [ ] 1.4 Update `IQrPrimitives`: add `expiresAt: Date | null`
- [ ] 1.5 Update `QrAggregate`:
  - Add private `_expiresAt: QrExpiresAtValueObject | null` field
  - Add `expiresAt` getter
  - Add `isExpired(): boolean` method (`_expiresAt !== null && _expiresAt.value! < new Date()`)
  - Update `toPrimitives()` to include `expiresAt`
- [ ] 1.6 Update `QrViewModel`: add `expiresAt: Date | null`

### 1.2 Application layer

- [ ] 1.7 Update `CreateQrCommandInput` and `CreateQrCommand`:
  - Add `expiresAt?: Date` to input interface
  - In command constructor, wrap as `new QrExpiresAtValueObject(input.expiresAt ?? null)` and store as field
- [ ] 1.8 Update `CreateQrCommandHandler`: pass `expiresAt` from command to `QrBuilder`
- [ ] 1.9 Update `QrBuilder`: add `withExpiresAt(value: Date | null): this` method (hydration path — construct VO directly without re-triggering future-date validation)
- [ ] 1.10 Create `AssertQrNotExpiredService` at `src/contexts/qr/application/services/read/assert-qr-not-expired.service.ts`:
  - `execute(viewModel: QrViewModel): void` — throws `QrExpiredError` if `viewModel.expiresAt !== null && viewModel.expiresAt < new Date()`
- [ ] 1.11 Update `QrFindByIdQueryHandler`: after `assertQrViewModelExists`, call `assertQrNotExpired.execute(viewModel)`
- [ ] 1.12 Update `QrFindPngByIdQueryHandler`: same as 1.11 (assert not expired before returning PNG)
- [ ] 1.13 Register `AssertQrNotExpiredService` in `qr.module.ts` (add to `APPLICATION_SERVICES` array)

### 1.3 Infrastructure layer

- [ ] 1.14 Update `QrTypeOrmEntity`: add `@Column({ name: 'expires_at', type: 'timestamp', nullable: true }) expiresAt!: Date | null`
- [ ] 1.15 Update `QrTypeOrmMapper`:
  - `toAggregate`: pass `entity.expiresAt` to builder's `withExpiresAt()`
  - `toEntity`: set `entity.expiresAt = primitives.expiresAt`
  - `toViewModel`: include `expiresAt: entity.expiresAt`
- [ ] 1.16 Create migration `{1780000000008}-AddExpiresAtToQrs.ts`:
  - `up`: `ALTER TABLE qrs ADD COLUMN expires_at TIMESTAMPTZ NULL`
  - `down`: `ALTER TABLE qrs DROP COLUMN expires_at`

### 1.4 Transport layer

- [ ] 1.17 Update REST `QrRestResponseDto`: add `expiresAt: Date | null` with `@ApiProperty({ nullable: true, required: false, type: Date })`
- [ ] 1.18 Update REST create/request DTO (if a REST `POST /qrs` endpoint exists, or the internal path that maps inputs): add optional `expiresAt?: string` (ISO date string → parsed to `Date | null`)
- [ ] 1.19 Update `QrGraphQL` response DTO (`QrResponseDto`): add `@Field(() => Date, { nullable: true }) expiresAt?: Date`
- [ ] 1.20 Update `QrGraphQLMapper`: map `expiresAt`
- [ ] 1.21 Update `QrRestMapper` (if separate from TypeORM mapper): map `expiresAt`

### 1.5 Tests

- [ ] 1.22 Unit test `QrExpiresAtValueObject`:
  - Past date throws
  - Present date (`<=`) throws
  - Future date is accepted
  - `null` is accepted
- [ ] 1.23 Unit test `QrAggregate`: `isExpired()` returns correct boolean for null, past, and future dates
- [ ] 1.24 Unit test `AssertQrNotExpiredService`: expired VM throws `QrExpiredError`; non-expired passes
- [ ] 1.25 Unit test `CreateQrCommandHandler`: `expiresAt` is passed to builder when provided; null when absent
- [ ] 1.26 Update `QrFindByIdQueryHandler` unit test: expired QR → `QrExpiredError`; non-expired → ViewModel
- [ ] 1.27 Update `QrFindPngByIdQueryHandler` unit test: expired QR → `QrExpiredError`
- [ ] 1.28 Update `QrTypeOrmMapper` unit test: `expiresAt` round-trips correctly (null and date)
- [ ] 1.29 Update integration spec (`test/integration/qr/`): persist QR with and without `expiresAt`; verify round-trip
- [ ] 1.30 Update E2E spec: GET `/api/qrs/:id` returns `expiresAt` in response; expired QR returns 410

---

## Post-MVP (not in this change)

- [ ] `UpdateQrExpiresAt` command + endpoint for mutating expiry after creation
- [ ] Background job to clean up long-expired QRs
- [ ] Expiry enforcement on scan-redirect proxy (if public endpoint added later)
