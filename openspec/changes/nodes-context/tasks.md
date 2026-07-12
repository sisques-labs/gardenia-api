# Tasks: Nodes Bounded Context (IoT integration)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 3200–4000 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain+Application (Bridge/Node) → PR 2: Insert-only records + Kafka consumer/producer → PR 3: Infrastructure (TypeORM) + Module wiring → PR 4: Transport (REST+GraphQL+MCP) + E2E |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes (see Phase 0 spike, T0)
Chained PRs recommended: Yes — this is roughly 2.5x the size of `plant-context`
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Spike (T0) + package bump + migrations + domain (Bridge/Node aggregates, VOs, events, exceptions) | PR 1 | Base: main |
| 2 | Insert-only records + application layer (commands/queries/services) + Kafka consumer/producer infra | PR 2 | Base: PR 1 branch |
| 3 | TypeORM persistence + module wiring, app boots with DI resolved | PR 3 | Base: PR 2 branch |
| 4 | Transport (REST bootstrap, GraphQL, MCP tools) + all test layers + README | PR 4 | Base: PR 3 branch |

---

## Dependency Graph

```
T0 (spike) → T5 (FindOrCreateNodeService design), T20 (Kafka consumer bootstrap)
T1 (package bump) — independent, do first
T2 (migrations) — independent
T3 → T4 (Bridge domain) → T8, T9 (Bridge commands)
T3 → T5 (Node domain) → T10, T11, T12 (Node/telemetry/heartbeat/ack commands)
T6 (insert-only records) → T11, T12
T7 (SensorTypeEnum) → T6
T4, T5 → T13 (queries) → T29 (unit tests)
T14 → T15 (TypeORM entities/mappers) → T16, T17 (repositories, incl. §5.4 spike resolution)
T17 → T30 (integration tests)
T18 (Kafka topics/parsers) → T19 (producer adapter), T20 (consumer bootstrap)
T4,T5,T6,T16,T17,T18,T19,T20 → T21 (module wiring)
T21 → T22 (REST bootstrap) → T23 (GraphQL) → T24 (MCP tools)
T21 → T31 (E2E tests)
```

---

## Phase 0: Spike — resolve before writing handlers

- [ ] T0: **Spike — `SpaceContext` API surface.** Read
      `node_modules/@sisques-labs/nestjs-kit/dist/.../space-context*` (or the
      kit's source if available) and confirm whether it exposes a
      `.run(spaceId, fn)` / `enterWith`-style escape hatch for entering an ALS
      frame outside `SpaceInterceptor`. **If yes**: design.md §5.4/§9's dual
      `NODE_UNSCOPED_*` tokens are UNNECESSARY — use
      `spaceContext.run(bridge.spaceId, () => ...)` around the Kafka-consumer
      path instead, and skip T16's "unscoped variant" work. **If no**: proceed
      with the dual-token design as written. Record the decision in this
      task's checkbox comment before starting T16.

---

## Phase 1: Foundation — package bump, migrations, Bridge/Node domain

- [ ] T1: Bump `@sisques-labs/nestjs-kit` to `^1.3.0` in `package.json`
      (already published — contains `EVENT_CONSUMER`/`IEventConsumer`/
      `KafkajsEventConsumerAdapter`). Run `pnpm install`. Verify
      `MessagingModule.forRoot()` in `CoreModule` still boots cleanly
      (`EVENT_CONSUMER` is now also bound, unused until this change wires a
      consumer — confirm no DI regression).
- [ ] T2: Create four migrations in `src/database/migrations/` (use the
      next available timestamps — check the highest existing file first):
      `CreateBridges` (id uuid PK no default, space_id nullable uuid, name
      nullable varchar(100), status varchar not null default 'UNCLAIMED',
      pairing_code nullable varchar(16), last_seen_at nullable timestamp,
      created_at/updated_at); `CreateNodes` (id uuid PK no default, space_id
      uuid NOT NULL, bridge_id uuid NOT NULL + plain index, name nullable,
      status varchar not null default 'OFFLINE', last_seen_at nullable,
      timestamps); `CreateNodeTelemetryReadings` (id uuid PK default
      uuid_generate_v4(), space_id, node_id, sensor_type varchar not null,
      value numeric not null, unit nullable varchar, recorded_at timestamp
      not null + composite index `(space_id, node_id, recorded_at)`);
      `CreateNodeCommandAcks` (id uuid PK default uuid_generate_v4(),
      command_id nullable varchar + plain index, node_id, space_id, result
      varchar not null, received_at timestamp not null). No FK constraints.
- [ ] T3: Create shared value objects in `src/contexts/nodes/domain/value-objects/`:
      `bridge-id/`, `bridge-name/` (maxLength 100), `bridge-status/`
      (`EnumValueObject<typeof BridgeStatusEnum>`), `pairing-code/` (maxLength
      16, format `GRDN-[A-Z0-9]{4}` validated in constructor, throws
      `InvalidPairingCodeException`), `node-id/`, `node-name/` (maxLength
      100), `node-status/` (`EnumValueObject<typeof NodeStatusEnum>`). Create
      enums `domain/enums/bridge-status.enum.ts` (UNCLAIMED/ACTIVE/OFFLINE),
      `domain/enums/node-status.enum.ts` (ONLINE/OFFLINE). Acceptance: VO
      constructors reject malformed input (empty name over maxLength, bad
      pairing-code format).
- [ ] T4: Create `src/contexts/nodes/domain/aggregates/bridge.aggregate.ts`
      (BridgeAggregate extends BaseAggregate; fields per design §3.1;
      `bootstrap()` idempotent no-op when already ACTIVE, generates fresh
      PairingCodeValueObject when UNCLAIMED, emits BridgeBootstrappedEvent;
      `claim(spaceId, suppliedCode)` throws BridgeAlreadyClaimedException /
      InvalidPairingCodeException, emits BridgeClaimedEvent; `rename(name)`).
      Create `domain/interfaces/bridge.interface.ts`,
      `domain/primitives/bridge.primitives.ts`,
      `domain/view-models/bridge.view-model.ts`,
      `domain/builders/bridge.builder.ts` (BridgeBuilder — note `withId`
      takes the bridge-supplied uuid directly, no generation). Create
      `domain/events/interfaces/bridge-event-data.interface.ts`,
      `bridge-bootstrapped/bridge-bootstrapped.event.ts`,
      `bridge-claimed/bridge-claimed.event.ts`. Create
      `domain/exceptions/bridge-not-found.exception.ts`,
      `bridge-already-claimed.exception.ts`,
      `invalid-pairing-code.exception.ts`. Acceptance: `bootstrap()` on a
      fresh aggregate sets UNCLAIMED + a valid code; `claim()` with wrong
      code throws; `claim()` twice throws BridgeAlreadyClaimedException.
- [ ] T5: Create `src/contexts/nodes/domain/aggregates/node.aggregate.ts`
      (NodeAggregate extends BaseAggregate; fields per design §3.2;
      `create()` emits NodeCreatedEvent; `markOnline()`/`markOffline()`
      no-op+no-event if already in that state, otherwise flip + touch +
      emit NodeWentOnline/OfflineEvent; `touchLastSeen(at)`). Create
      `domain/interfaces/node.interface.ts`,
      `domain/primitives/node.primitives.ts`,
      `domain/view-models/node.view-model.ts`,
      `domain/builders/node.builder.ts` (NodeBuilder — `withId` takes the
      node-supplied uuid directly). Create
      `domain/events/interfaces/node-event-data.interface.ts`,
      `node-created/node-created.event.ts`,
      `node-went-online/node-went-online.event.ts`,
      `node-went-offline/node-went-offline.event.ts`. Create
      `domain/exceptions/node-not-found.exception.ts`. Acceptance:
      `markOnline()` twice in a row emits exactly one event; `create()`
      snapshot round-trips through `toPrimitives()`.
- [ ] T6: Create insert-only records per design §3.4:
      `domain/records/node-telemetry-reading.record.ts`
      (NodeTelemetryReading — plain class, static `create()` factory, NO
      BaseAggregate/events), `domain/records/node-command-ack.record.ts`
      (NodeCommandAck — same treatment, `commandId: string | null`).
      Create `domain/interfaces/node-telemetry-reading.interface.ts`,
      `node-command-ack.interface.ts`,
      `domain/view-models/node-telemetry-reading.view-model.ts` (extends
      BaseViewModel — needed for the Criteria pattern). Depends on T7
      (SensorTypeEnum).
- [ ] T7: Create `domain/enums/sensor-type.enum.ts` (SensorTypeEnum — 7
      values per proposal §Domain Model, closed catalog, no VO wrapper).
- [ ] T8: Create repository interfaces:
      `domain/repositories/read/bridge-read.repository.ts`
      (IBridgeReadRepository = IBaseReadRepository<BridgeViewModel>,
      BRIDGE_READ_REPOSITORY token),
      `domain/repositories/write/bridge-write.repository.ts`
      (IBridgeWriteRepository = IBaseWriteRepository<BridgeAggregate>,
      BRIDGE_WRITE_REPOSITORY token),
      `domain/repositories/read/node-read.repository.ts`,
      `domain/repositories/write/node-write.repository.ts` (standard
      pattern, NODE_READ/WRITE_REPOSITORY tokens),
      `domain/repositories/read/node-telemetry-reading-read.repository.ts`
      (INodeTelemetryReadingReadRepository = IBaseReadRepository<…ViewModel>,
      token), `domain/repositories/write/node-telemetry-reading-write.repository.ts`
      (narrow `insert()`-only interface per design §3.4, token),
      `domain/repositories/write/node-command-ack-write.repository.ts`
      (narrow `insert()`-only interface, token). **If T0's spike says "no
      `.run()` escape hatch"**, also add
      `NODE_UNSCOPED_READ_REPOSITORY`/`NODE_UNSCOPED_WRITE_REPOSITORY`
      tokens here.

---

## Phase 2: Application Layer + Kafka messaging infra

> Write T29 unit tests alongside or immediately after each handler/service.

- [ ] T9: Create `application/commands/bootstrap-bridge/` (command inputs:
      `bridgeId`; handler per design §4.1 — find-or-bootstrap, idempotent
      no-op branch for already-claimed, `Logger.log` of the pairing code).
      No auth/space dependency.
- [ ] T10: Create `application/commands/claim-bridge/` (command inputs:
      `bridgeId`, `pairingCode`, `spaceId` from injected `SpaceContext` per
      design §4.2). Create `application/services/write/assert-bridge-exists/`
      (AssertBridgeExistsService — unscoped `findById`, throws
      BridgeNotFoundException). Acceptance: wrong code → 400; already
      claimed → 409; success → bridge ACTIVE with correct spaceId.
- [ ] T11: Create `application/commands/send-node-command/` (command inputs:
      `nodeId`, `commandType`, `payload`, `spaceId` from SpaceContext;
      handler per design §4.3 — asserts node exists via TENANT-scoped
      `AssertNodeExistsService`, generates commandId, calls
      `NodesKafkaCommandProducerAdapter.send()`, returns commandId). Create
      `application/services/write/assert-node-exists/` (tenant-scoped).
      Depends on T18/T19 (producer adapter) — stub the adapter interface
      first if sequencing requires it, wire the real one once T19 lands.
- [ ] T12: Create the three internal Kafka-dispatched commands per design
      §4.4: `application/commands/record-telemetry-reading/`,
      `record-node-heartbeat/`, `record-node-command-ack/` (command
      constructors wrap already-parsed primitives, no re-validation).
      Create `application/services/write/find-or-create-node/` (per design
      §4.6 and the T0 spike outcome — either the dual-token unscoped-repo
      version or the `spaceContext.run()` version). Acceptance: a brand-new
      nodeId creates a NodeAggregate with spaceId inherited from its
      bridge; an unknown bridgeId logs+drops without throwing past the
      handler (message loss, not consumer crash).
- [ ] T13: Create queries per design §4.5:
      `application/queries/node-find-by-id/`,
      `node-find-by-criteria/`, `bridge-find-by-id/`,
      `bridge-find-by-criteria/` (handler manually adds the spaceId
      QueryBuilder clause per design §5.3 — bridge repo is NOT
      tenant-wrapped), `node-telemetry-reading-find-by-criteria/`. Create
      `application/services/read/assert-bridge-view-model-exists/`,
      `assert-node-view-model-exists/`.
- [ ] T14: Create `infrastructure/messaging/kafka/nodes-kafka-topics.constants.ts`
      (literal `gardenia-bridge.telemetry`/`.heartbeat`/`.command-acks`/
      `.commands` — NOT derived from `topicPrefix`, these belong to
      `gardenia-bridge`'s own naming). Create
      `infrastructure/messaging/parsers/telemetry-message.parser.ts`,
      `heartbeat-message.parser.ts`, `command-ack-message.parser.ts` (Zod
      schemas parsing the raw Kafka JSON value into the internal command
      input shape; malformed payload → parser throws → caught by the
      kit adapter's best-effort wrapper, logged, message skipped).
- [ ] T15: Create `infrastructure/messaging/kafka/nodes-kafka-command-producer.adapter.ts`
      per design §5.6 (raw kafkajs Producer, own `IKafkaConfig` read,
      `KAFKA_ENABLED` no-op gate, connect/disconnect lifecycle). Unit test
      mirrors `kafkajs-event-consumer.adapter.spec.ts`'s mocking style
      (`jest.mock('kafkajs')`).
- [ ] T16: Create `infrastructure/messaging/kafka/nodes-kafka-consumer-bootstrap.service.ts`
      per design §5.5 (`OnModuleInit`, injects `EVENT_CONSUMER`, 3x
      `.run()` calls, one per topic, each parsing via T14's parsers and
      dispatching the matching T12 command via CommandBus).
- [ ] T29 (partial, application layer): unit tests for all aggregates,
      records, commands, queries, services created in Phase 1–2. Co-located
      `.spec.ts`. Include: BridgeAggregate bootstrap/claim state machine,
      NodeAggregate markOnline/Offline idempotency, both parsers'
      malformed-input rejection, NodesKafkaCommandProducerAdapter
      enabled/disabled branches. Coverage ≥ 80% for domain+application.

---

## Phase 3: Infrastructure — TypeORM + Module Wiring

- [ ] T17: Create TypeORM entities per design §5.1:
      `infrastructure/persistence/typeorm/entities/bridge.entity.ts`,
      `node.entity.ts` (both `@PrimaryColumn('uuid')`, NOT
      `@PrimaryGeneratedColumn` — ids are supplied), `node-telemetry-reading.entity.ts`,
      `node-command-ack.entity.ts` (both `@PrimaryGeneratedColumn('uuid')` —
      these ARE gardenia-api-generated).
- [ ] T18: Create mappers per design §5.2:
      `bridge-typeorm.mapper.ts`, `node-typeorm.mapper.ts` (standard
      toAggregate/toEntity/toViewModel trio), `node-telemetry-reading-typeorm.mapper.ts`
      (toEntity/toViewModel only — no toAggregate).
- [ ] T19: Create `BridgeTypeOrmReadRepository`/`WriteRepository` per design
      §5.3 — **NOT wrapped in `createTenantRepository`**; `findById` plain,
      `BridgeFindByCriteriaQueryHandler` (from T13) adds the spaceId
      QueryBuilder clause itself, not the repository.
- [ ] T20: Create `NodeTypeOrmReadRepository`/`WriteRepository` per T0's
      spike resolution: either (a) `spaceContext.run()` approach — single
      tenant-wrapped repository pair, reused everywhere, OR (b) dual-token
      approach — repository classes take an optional `spaceContext:
      SpaceContext | null` constructor param, two provider bindings in
      T21's module (tenant-wrapped for HTTP/GraphQL paths, unscoped for the
      Kafka-consumer path). Document which was chosen in this task's
      comment before marking complete.
- [ ] T21: Create `NodeTelemetryReadingTypeOrmReadRepository` (tenant-wrapped,
      standard findByCriteria via QueryBuilder covering all 8
      FilterOperator values per the mandatory Criteria pattern),
      `NodeTelemetryReadingTypeOrmWriteRepository` (implements the narrow
      `insert()`-only interface — single `this.repo.insert(mapper.toEntity(record))`
      call, nothing else), `NodeCommandAckTypeOrmWriteRepository` (same
      narrow shape, unscoped — spaceId comes from the record itself, not
      ALS).
- [ ] T30 (integration tests): `bridge-typeorm-{read,write}.repository.spec.ts`
      (Testcontainers Postgres — confirm bridge repos are correctly
      NOT space-filtered at the repo layer), `node-typeorm-{read,write}.repository.spec.ts`
      (both variants from T20's resolution — cross-space isolation for the
      scoped one, cross-space visibility-by-design for the unscoped one),
      `node-telemetry-reading-typeorm-{read,write}.repository.spec.ts`
      (insert + findByCriteria, tenant isolation), migration apply/rollback
      smoke test for all four new tables.
- [ ] T22: Create `src/contexts/nodes/nodes.module.ts` per design §7 — all
      provider groups, `BridgesController` in `controllers:`. Add
      `NodesModule` to `src/app.module.ts` imports. **CRITICAL: modify
      `src/core/filters/base-exception.filter.ts`** — add imports + branches
      for `BridgeNotFoundException`/`NodeNotFoundException` (404),
      `InvalidPairingCodeException` (400), and **new**
      `BridgeAlreadyClaimedException` (409 CONFLICT — first use of this
      status in the filter, verify the GraphQL error mapping too).
      Acceptance: app boots with zero DI errors; `pnpm build` succeeds.

---

## Phase 4: Transport (REST + GraphQL + MCP) + Tests + Docs

- [ ] T23: Create REST DTOs (`transport/rest/dtos/bootstrap-bridge.dto.ts`,
      `bridge-rest-response.dto.ts`) and
      `transport/rest/controllers/bridges.controller.ts` per design §6.1
      (`POST /nodes/bridges/bootstrap`, `@SkipSpace()`, no
      `@ApiBearerAuth`). Acceptance: endpoint reachable with no `X-Space-ID`
      header and no JWT.
- [ ] T24: Create GraphQL request/response DTOs, the four
      `*QueryableField` enums + filterable-fields registries (+ `.spec.ts`
      each, per the mandatory Criteria pattern) for Node/Bridge/
      NodeTelemetryReading, `nodes-registered-enums.graphql.ts`
      (BridgeStatus/NodeStatus/SensorType). Create
      `BridgeQueriesResolver`, `BridgeMutationsResolver` (bridgeClaim only),
      `NodeQueriesResolver`, `NodeMutationsResolver` (nodeSendCommand) per
      design §6.2. CommandBus/QueryBus dispatch only.
- [ ] T25: Create seven MCP tools + Zod schemas under `transport/mcp/`
      per design §6.3 (`bridge_claim`, `bridge_find_by_id`,
      `bridge_find_by_criteria`, `node_find_by_id`, `node_find_by_criteria`,
      `node_send_command`, `node_telemetry_reading_find_by_criteria`).
      Register `MCP_TOOLS` array in `nodes.module.ts`. Confirm
      `bridge_bootstrap` is NOT among them (documented exclusion).
- [ ] T26: Create/update `src/contexts/nodes/README.md` per
      `openspec/config.yaml`'s apply rule — full current-state walkthrough
      of the context (not just the delta), following the `auth` context
      README as template.
- [ ] T27: Wire `SendNodeCommandCommand` (T11) to the now-real
      `NodesKafkaCommandProducerAdapter` (T15) if it was stubbed earlier;
      remove any temporary stub.
- [ ] T28: Confirm metrics/observability doesn't need
      `src/core/metrics/exempt-metrics-from-space-guard.ts` updated for the
      new `@SkipSpace()` bootstrap route (check whether that file's exemption
      list is route-pattern-based and whether `/nodes/bridges/bootstrap`
      needs adding — mirrors how `/auth/*` routes are handled there).
- [ ] T29 (finish): remaining unit tests for transport-layer mappers/
      resolvers/controller not covered in Phase 2's partial pass.
- [ ] T31: E2E tests in `test/nodes/` (or co-located):
      `nodes-bootstrap.e2e-spec.ts` — REST bootstrap happy path (fresh
      bridge → pairing code returned+logged), idempotent re-bootstrap of
      claimed bridge (no-op), no-auth-required assertion.
      `nodes-claim.e2e-spec.ts` (GraphQL) — happy path claim, wrong code
      (400), already-claimed (409), unauthenticated (401).
      `nodes-send-command.e2e-spec.ts` — command dispatched for own-space
      node (verify producer called, mock kafkajs at the boundary), rejected
      for cross-space node (404). Kafka-consumer path: either an
      integration test that publishes a real message to a Testcontainers
      Kafka broker and asserts the row lands in Postgres, OR (if Kafka
      Testcontainers is too heavy for this suite) a focused
      integration/unit test that calls
      `NodesKafkaConsumerBootstrapService`'s handler methods directly with
      a fake `IInboundMessage`, bypassing the real broker — decide based on
      whether the repo already has Kafka Testcontainers precedent (check
      `docker-compose.test.yml` before choosing). All tests run against
      migrations (not synchronize). Acceptance: ≥ 80% coverage for the
      `nodes` context; all proposal Success Criteria checkboxes verified.
