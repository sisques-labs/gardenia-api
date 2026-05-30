---
name: architecture
description: "Trigger: new context, new feature, add command, add query, add aggregate, new module, implement, create class, which layer, where does X go. Enforce DDD+CQRS+Hexagonal layer rules and file naming for gardenia-api."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Activation Contract

Apply this skill whenever creating or modifying any file under `src/contexts/` or `src/core/`.

## Hard Rules

1. **Constructor = hydration only.** Never call `this.apply()` inside a constructor. Domain events are emitted exclusively from named instance methods (`create()`, `delete()`, etc.).
2. **Resolvers use the bus, never services.** `CommandBus.execute()` / `QueryBus.execute()` only — no direct service injection in transport.
3. **`MutationResponseGraphQLMapper` is global.** It is provided by `AppModule`. Never add it to a bounded-context module's providers.
4. **Repository interfaces live in domain.** Infrastructure classes implement them; domain never imports from infrastructure.
5. **No module compilation tests.** Do not create `*.module.spec.ts` files.
6. **Unit tests = manual instantiation.** Use `jest.Mocked<T>`, co-located with source. No `@nestjs/testing` in unit specs (enforced by ESLint `no-restricted-imports` on `src/**/*.spec.ts`).

## Test Layers

| Layer | Location | DB | `@nestjs/testing` |
|-------|----------|-----|-------------------|
| Unit | `src/**/*.spec.ts` | Mocked | **Forbidden** |
| Integration | `test/integration/**/*.integration-spec.ts` | Real Postgres | **Allowed** |
| API E2E | `test/**/*.e2e-spec.ts` | Real Postgres | **Allowed** |

Integration specs bootstrap slim bounded-context modules via `test/helpers/integration-bootstrap.ts`. E2E specs use `test/helpers/app-bootstrap.ts` with full `AppModule`.

## Bounded Context Structure

```
src/contexts/{context}/
├── domain/
│   ├── aggregates/        {name}.aggregate.ts       — extends BaseAggregate; create() emits event
│   ├── builders/          {name}.builder.ts          — fluent builder; build() returns aggregate
│   ├── events/            {name}-{verb}/{name}-{verb}.event.ts
│   ├── exceptions/        {reason}.exception.ts      — extend BaseException from nestjs-kit
│   ├── interfaces/        {name}.interface.ts        — aggregate field shape
│   ├── primitives/        {name}.primitives.ts       — plain object with all raw values
│   ├── repositories/
│   │   ├── read/          {name}-read.repository.ts  — interface + DI token (Symbol)
│   │   └── write/         {name}-write.repository.ts — interface + DI token (Symbol)
│   ├── value-objects/     {name}/{name}.vo.ts        — immutable, validate in constructor
│   ├── view-models/       {name}.view-model.ts       — read-side projection
│   └── enums/             {name}.enum.ts
├── application/
│   ├── commands/          {name}/{name}.command.ts + {name}.handler.ts
│   ├── queries/           {name}/{name}.query.ts  + {name}.handler.ts
│   └── services/
│       ├── read/          assert-{x}-exists.service.ts
│       └── write/         assert-{x}-available.service.ts
├── infrastructure/
│   ├── persistence/typeorm/
│   │   ├── entities/      {name}.entity.ts           — TypeORM @Entity
│   │   ├── mappers/       {name}-typeorm.mapper.ts   — entity ↔ aggregate
│   │   └── repositories/  {name}-typeorm-{read|write}.repository.ts
│   ├── guards/            {name}.guard.ts
│   ├── strategies/        {name}.strategy.ts
│   └── decorators/        {name}.decorator.ts
├── transport/
│   ├── graphql/
│   │   ├── resolvers/     {name}.resolver.ts         — CommandBus/QueryBus only
│   │   ├── dtos/          {name}.input.ts
│   │   ├── objects/       {name}.object.ts
│   │   ├── mappers/       {name}.mapper.ts
│   │   └── enums/         {name}-registered-enums.graphql.ts
│   └── rest/
│       ├── {name}.controller.ts
│       └── dtos/          {name}.dto.ts
└── {context}.module.ts
```

## Decision Gates

| Question | Answer |
|----------|--------|
| Where does business logic live? | `domain/aggregates/` — inside aggregate methods |
| Where does orchestration live? | `application/commands/` or `application/queries/` handlers |
| Where does DB mapping live? | `infrastructure/persistence/typeorm/mappers/` |
| Where does HTTP/GraphQL wiring live? | `transport/` — no logic, only bus dispatch |
| Cross-context shared utilities? | `src/core/` (filters, config, guards) |

## Naming Conventions

| Artifact | Pattern | Example |
|----------|---------|---------|
| Aggregate | `{name}.aggregate.ts` | `user.aggregate.ts` |
| Event | `{name}-{past-verb}.event.ts` | `user-created.event.ts` |
| Exception | `{reason}.exception.ts` | `user-not-found.exception.ts` |
| Command | `{verb}-{name}.command.ts` | `create-user.command.ts` |
| Query | `{name}-find-by-{x}.query.ts` | `user-find-by-id.query.ts` |
| VO | `{name}.vo.ts` or `{name}.value-object.ts` | `username.value-object.ts` |
| Spec | co-located, same name + `.spec.ts` | `user.aggregate.spec.ts` |

## References

- `src/contexts/auth/README.md` — auth context walkthrough
- `src/contexts/users/README.md` — users context walkthrough
- `src/core/README.md` — cross-cutting concerns
- `.claude/skills/architecture/assets/aggregate-template.ts.template` — aggregate starter
