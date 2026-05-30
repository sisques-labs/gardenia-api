# Exploration: plant-context — gardenia-api

## Current State

Three bounded contexts exist under `src/contexts/`:

| Context | Aggregate | Transport | Tenant-scoped? |
|---------|-----------|-----------|----------------|
| auth | AccountAggregate, AuthSessionAggregate | REST + GraphQL | No (global) |
| users | UserAggregate | GraphQL only | Yes (`spaceId` column) |
| spaces | SpaceAggregate | REST only | No (is the tenant root) |
| **plants** (new) | PlantAggregate | TBD | **Yes** |

---

## Naming Conventions

| Artifact | Pattern |
|----------|---------|
| Aggregate | `domain/aggregates/{name}.aggregate.ts` |
| Interface | `domain/interfaces/{name}.interface.ts` |
| Primitives | `domain/primitives/{name}.primitives.ts` extends `BasePrimitives` |
| ViewModel | `domain/view-models/{name}.view-model.ts` extends `BaseViewModel` |
| Builder | `domain/builders/{name}.builder.ts` extends `BaseBuilder<Agg, VM>` |
| Value object | `domain/value-objects/{name}-{field}/{name}-{field}.value-object.ts` |
| Domain entity (non-root) | `domain/entities/{name}.entity.ts` |
| Event | `domain/events/{event-name}/{event-name}.event.ts` extends `BaseEvent<TData>` |
| Exception | `domain/exceptions/{description}.exception.ts` extends `BaseException` |
| Enum | `domain/enums/{name}.enum.ts` |
| Read repo interface | `domain/repositories/read/{name}-read.repository.ts` |
| Write repo interface | `domain/repositories/write/{name}-write.repository.ts` |
| Command | `application/commands/{verb}-{noun}/{verb}-{noun}.command.ts` |
| Command handler | same folder, `.handler.ts`; decorated with `@CommandHandler` |
| Query | `application/queries/{noun}-{find-type}/{noun}-{find-type}.query.ts` |
| Query handler | same folder, `.handler.ts`; decorated with `@QueryHandler` |
| Assert write service | `application/services/write/assert-{noun}-exists/assert-{noun}-exists.service.ts` |
| Assert read service | `application/services/read/assert-{noun}-view-model-exists/...service.ts` |
| TypeORM entity | `infrastructure/persistence/typeorm/entities/{name}.entity.ts` |
| TypeORM mapper | `infrastructure/persistence/typeorm/mappers/{name}-typeorm.mapper.ts` |
| TypeORM read repo | `infrastructure/persistence/typeorm/repositories/{name}-typeorm-read.repository.ts` |
| TypeORM write repo | `infrastructure/persistence/typeorm/repositories/{name}-typeorm-write.repository.ts` |
| REST controller | `transport/rest/controllers/{plural}.controller.ts` |
| REST request DTO | `transport/rest/dtos/{verb}-{noun}.dto.ts` |
| REST response DTO | `transport/rest/dtos/{name}-rest-response.dto.ts` |
| REST mapper | `transport/rest/mappers/{noun}/{noun}.mapper.ts` |
| GQL resolver (queries) | `transport/graphql/resolvers/{noun}/{noun}-queries.resolver.ts` |
| GQL resolver (mutations) | `transport/graphql/resolvers/{noun}/{noun}-mutations.resolver.ts` |

---

## Shared Primitives (@sisques-labs/nestjs-kit v0.10.2)

| Class | Role |
|-------|------|
| `BaseAggregate` | Wraps `AggregateRoot`; adds `createdAt`, `updatedAt`, `touch()` |
| `BaseBuilder<Agg, VM>` | `withId/withCreatedAt/withUpdatedAt/validate()`, `build()`, `buildViewModel()` |
| `BaseViewModel` | Read model base: `id`, `createdAt`, `updatedAt` |
| `BasePrimitives` | Scalar snapshot: `id: string`, `createdAt: Date`, `updatedAt: Date` |
| `BaseEvent<TData>` | Domain event with `IEventMetadata + data` |
| `BaseCommandHandler<TCommand, TAggregate>` | Provides `publishEvents(aggregate)` |
| `BaseDatabaseRepository` | Provides `calculatePagination(criteria)` |
| `UuidValueObject`, `StringValueObject`, `EnumValueObject<T>` | Core VOs |
| `Criteria`, `PaginatedResult<T>` | Query/pagination types |
| `FieldIsRequiredException`, `BaseException` | Domain errors |

---

## Suggested Structure for `plant` Context

```
src/contexts/plants/
├── plants.module.ts
├── domain/
│   ├── aggregates/plant.aggregate.ts
│   ├── interfaces/plant.interface.ts
│   ├── primitives/plant.primitives.ts
│   ├── view-models/plant.view-model.ts
│   ├── builders/plant.builder.ts
│   ├── enums/plant-status.enum.ts
│   ├── value-objects/
│   │   ├── plant-id/plant-id.value-object.ts
│   │   └── plant-name/plant-name.value-object.ts
│   ├── events/
│   │   ├── interfaces/plant-event-data.interface.ts
│   │   ├── plant-created/plant-created.event.ts
│   │   ├── plant-updated/plant-updated.event.ts
│   │   └── plant-deleted/plant-deleted.event.ts
│   ├── exceptions/
│   │   ├── plant-not-found.exception.ts
│   │   └── plant-name-already-taken.exception.ts
│   └── repositories/
│       ├── read/plant-read.repository.ts
│       └── write/plant-write.repository.ts
├── application/
│   ├── commands/
│   │   ├── create-plant/{create-plant.command.ts, create-plant.handler.ts}
│   │   ├── update-plant/{update-plant.command.ts, update-plant.handler.ts}
│   │   └── delete-plant/{delete-plant.command.ts, delete-plant.handler.ts}
│   ├── queries/
│   │   ├── plant-find-by-id/{.query.ts, .handler.ts}
│   │   └── plant-find-by-criteria/{.query.ts, .handler.ts}
│   └── services/
│       ├── read/assert-plant-view-model-exists/
│       └── write/assert-plant-exists/
├── infrastructure/persistence/typeorm/
│   ├── entities/plant.entity.ts               ← spaceId column mandatory
│   ├── mappers/plant-typeorm.mapper.ts
│   └── repositories/
│       ├── plant-typeorm-read.repository.ts   ← createTenantRepository
│       └── plant-typeorm-write.repository.ts  ← createTenantRepository
└── transport/
    └── rest/ (TBD)
        ├── controllers/plants.controller.ts
        ├── dtos/
        └── mappers/plant/plant.mapper.ts
```

---

## Open Questions (Design Decisions for Proposal)

1. **Plant entity fields** — Beyond `id`, `name`, `spaceId`, `createdAt`, `updatedAt`? Candidates: species, notes, location, status (alive/dormant/dead), imageUrl, lastWateredAt.
2. **Transport** — REST (like spaces), GraphQL (like users), or both?
3. **Name uniqueness** — Unique per space? Or no constraint?
4. **Ownership model** — Belongs to space (any member) or to user within space (creator-only)?
5. **Domain-specific commands** — `water-plant`, `fertilize-plant` as separate commands, or all via `update-plant`?
6. **Event granularity** — Per-field events (like users) or single `PlantUpdatedEvent` (like spaces)?
7. **Authorization** — `SpaceGuard` sufficient, or owner-only protection needed?

---

## Risks

- **Tenant scoping gap**: Forgetting `createTenantRepository` silently exposes cross-space data. Integration tests MUST verify the space boundary.
- **SpaceContext in tests**: Tests must call `spaceContext.run(spaceId, fn)` or they throw `SpaceContextMissingException`.
- **Migration timestamp conflicts**: Generate timestamp at moment of writing.

---

## Recommendation

REST-only transport (mirrors spaces) is the safest starting point — tight scope, consistent with existing patterns. GQL queryability can be added later.

Proceed to proposal once design decisions above are confirmed.
