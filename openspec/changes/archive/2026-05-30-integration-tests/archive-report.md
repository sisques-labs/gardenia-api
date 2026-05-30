# Archive Report: integration-tests

**Archived**: 2026-05-30
**Status**: COMPLETE
**PRs**: #97 · #98 · #99 · #100 · #101 · #102 (stacked chain)

---

## Summary

Established a three-layer test pyramid (unit / integration / E2E) with real PostgreSQL, migration parity, optional Testcontainers for local dev, and CI jobs for integration and E2E. Phase 6 added ESLint enforcement, `TRUNCATE_TABLES` registry, openspec conventions, and canonical spec sync.

---

## Delivery Chain

| PR | Scope | Status |
|----|-------|--------|
| #97 | Foundation (jest config, bootstrap, CI job, README) | ✅ open |
| #98 | Pilot integration specs (3 specs, 7 tests) | ✅ open |
| #99 | Migration parity | ✅ open |
| #100 | Optional Testcontainers | ✅ open |
| #101 | E2E alignment with migrations | ✅ open |
| #102 | Maintenance hardening + archive | ✅ open |

---

## Artifacts Archived

| Artifact | Path |
|----------|------|
| Exploration | `openspec/changes/archive/2026-05-30-integration-tests/exploration.md` |
| Proposal | `openspec/changes/archive/2026-05-30-integration-tests/proposal.md` |
| Design | `openspec/changes/archive/2026-05-30-integration-tests/design.md` |
| Spec (delta) | `openspec/changes/archive/2026-05-30-integration-tests/specs/testing-infrastructure/spec.md` |
| Tasks | `openspec/changes/archive/2026-05-30-integration-tests/tasks.md` |
| Verify report | `openspec/changes/archive/2026-05-30-integration-tests/verify-report.md` |
| State | `openspec/changes/archive/2026-05-30-integration-tests/.openspec.yaml` |

## Main Specs Synced

| Delta | Canonical |
|-------|-----------|
| `specs/testing-infrastructure/spec.md` | `openspec/specs/testing-infrastructure/spec.md` |

---

## Key Design Decisions (for traceability)

- **Compose + GHA services as CI default** — Testcontainers optional locally via `USE_TESTCONTAINERS=1`.
- **Migrations over synchronize** — integration and E2E bootstrap via `bootstrapTestDataSource()`.
- **Slim integration bootstrap** — bounded-context modules only; full `AppModule` reserved for E2E.
- **ESLint guard** — `no-restricted-imports` blocks `@nestjs/testing` in `src/**/*.spec.ts`.
- **Removed auth.module.spec.ts** — module compilation tests forbidden by architecture skill.

---

## Verify: PASS (0 CRITICAL, 0 WARNING)

See `verify-report.md` for full matrix.
