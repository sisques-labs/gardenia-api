# Design: Planting Spot Fallow Status

## Architecture

No new bounded context, no new aggregate. `status` and `fallowSince` are added
as two more fields on the existing `PlantingSpotAggregate`, and two new
domain-specific commands sit alongside the existing `create`/`update`/`delete`
commands — the same shape `care-schedule`'s `CompleteCareSchedule` uses for a
domain action that isn't a generic field edit.

```
domain
  enums/             + PlantingSpotStatusEnum (ACTIVE | FALLOW)
  value-objects/      + PlantingSpotStatusValueObject (EnumValueObject)
                       + PlantingSpotFallowSinceValueObject (DateValueObject)
  interfaces/         IPlantingSpot: + status, + fallowSince
  primitives/         IPlantingSpotPrimitives: + status: string, + fallowSince: Date | null
  aggregates/         PlantingSpotAggregate: + _status, + _fallowSince,
                       + markFallow() (public), + markActive() (public),
                       + changeStatus() (private, shared by both)
  events/field-changed/ + status-changed/status-changed.event.ts
  builders/           PlantingSpotBuilder: + withStatus, + withFallowSince
  view-models/        PlantingSpotViewModel: + status, + fallowSince
application
  commands/create-planting-spot/       CommandInput excludes status/fallowSince;
                                         constructor hardcodes ACTIVE / null
  commands/mark-planting-spot-fallow/  NEW — mark-planting-spot-fallow.command.ts + .handler.ts
  commands/mark-planting-spot-active/  NEW — mark-planting-spot-active.command.ts + .handler.ts
  (update-planting-spot/ is UNCHANGED — status is not part of it)
infrastructure
  persistence/typeorm/entities/   PlantingSpotTypeOrmEntity: + status, + fallow_since
  persistence/typeorm/mappers/    map status/fallowSince both directions
transport
  graphql/  + plantingSpotMarkFallow / plantingSpotMarkActive mutations + request DTOs;
              response DTO + status/fallowSince; enum registered
  rest/     + POST :id/mark-fallow, POST :id/mark-active; response DTO + status/fallowSince
  mcp/      + planting_spot_mark_fallow, + planting_spot_mark_active tools/schemas
```

## Aggregate behaviour

Two new public methods, `markFallow()` and `markActive()`, both delegate to a
private `changeStatus(newStatus)` — the same `change*` shape as `changeName`,
`changeSoilType`, etc., with one addition: it also derives `fallowSince` as a
side effect, since that field has no independent setter and is never part of
any command input.

```ts
public markFallow(): void {
  this.changeStatus(
    new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.FALLOW),
  );
}

public markActive(): void {
  this.changeStatus(
    new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE),
  );
}

private changeStatus(newStatus: PlantingSpotStatusValueObject): void {
  const oldValue = this._status.value;
  const newValue = newStatus.value;
  if (oldValue === newValue) return;

  this._status = newStatus;
  this._fallowSince =
    newValue === PlantingSpotStatusEnum.FALLOW
      ? new PlantingSpotFallowSinceValueObject(new Date())
      : null;

  this.touch();
  this.apply(
    new PlantingSpotStatusChangedEvent(
      { /* metadata, same shape as other field-changed events */ },
      { id: this._id.value, oldValue, newValue },
    ),
  );
}
```

Calling `markFallow()` on an already-`FALLOW` spot (or `markActive()` on an
already-`ACTIVE` spot) is a no-op: no field change, no `touch()`, no event —
consistent with every other `change*` method's early-return guard. The command
handlers do **not** pre-check current status; they always call the method and
let the aggregate's own guard decide.

`fallowSince` does **not** get its own `*ChangedEvent` — like `care-schedule`'s
`nextDueAt`/`lastCompletedAt`, it is a derived field whose new value is visible
in the full-aggregate payload carried by `PlantingSpotStatusChangedEvent`'s
sibling event (`PlantingSpotUpdatedEvent` is NOT applied here — `markFallow`/
`markActive` are standalone actions, not routed through `update()` — so the
only event emitted per call is `PlantingSpotStatusChangedEvent`, whose
`toPrimitives()`-less field-changed payload only carries `oldValue`/`newValue`
for `status`; consumers needing `fallowSince` read it off the persisted
aggregate/view model, same as `nextDueAt` after `CareScheduleCompleted`).

`UpdatePlantingSpotCommand`/`PlantingSpotAggregate.update()` are **unchanged** —
no `status` parameter is added there.

## Command shape

Both commands take exactly the same input shape as `DeletePlantingSpotCommand`
— no fields beyond identity and authorization:

```ts
export type MarkPlantingSpotFallowCommandInput = Pick<
  IPlantingSpotPrimitives,
  'spaceId' | 'id'
> & { requestingUserId: string };

export class MarkPlantingSpotFallowCommand {
  public readonly id: PlantingSpotIdValueObject;
  public readonly requestingUserId: UuidValueObject;
  public readonly spaceId: UuidValueObject;
  // constructor identical in shape to DeletePlantingSpotCommand
}
```

`MarkPlantingSpotActiveCommand` is the mirror image. Both handlers:
1. Load the spot via `AssertPlantingSpotExistsService` (throws
   `PlantingSpotNotFoundException` / 404 if missing or wrong space).
2. Enforce ownership: `if (spot.userId.value !== command.requestingUserId.value)
   throw new PlantingSpotForbiddenException(...)` — same rule already used by
   `Update`/`DeletePlantingSpotCommandHandler` (owner-only, stricter than
   `care-schedule`'s "any space member").
3. Call `spot.markFallow()` / `spot.markActive()`.
4. Save via `plantingSpotWriteRepository.save(spot)`, publish events, log.

## Creation default

`CreatePlantingSpotCommandInput` excludes `status` and `fallowSince` from its
`Omit<IPlantingSpotPrimitives, …>` — a spot cannot be created directly into
`FALLOW`. `CreatePlantingSpotCommand`'s constructor hardcodes
`status = new PlantingSpotStatusValueObject(PlantingSpotStatusEnum.ACTIVE)` and
`fallowSince = null`; `CreatePlantingSpotCommandHandler` passes those through to
the builder exactly like every other field. No public API for creation changes
— existing REST/GraphQL/MCP create calls are unaffected.

## Persistence

`planting_spots` gains:

| column | type | notes |
|--------|------|-------|
| status | varchar(10) NOT NULL DEFAULT 'active' | `'active'` \| `'fallow'` |
| fallow_since | timestamptz NULL | set/cleared only by `markFallow()`/`markActive()` |

Migration `AddStatusAndFallowSinceToPlantingSpots` follows the same
`ADD COLUMN` / `DROP COLUMN IF EXISTS` shape as
`AddPlantingSpotCapacityAndFields`. The `DEFAULT 'active'` on `status`
backfills all existing rows with no manual data migration needed.

## Transport

- **REST**: `POST /planting-spots/:id/mark-fallow` and
  `POST /planting-spots/:id/mark-active`, `@HttpCode(200)`, guarded by
  `JwtAuthGuard`, requiring `X-Space-ID`. Both dispatch the corresponding
  command, then re-query via `PlantingSpotFindByIdQuery` and return
  `PlantingSpotRestResponseDto` — identical pattern to the existing `PATCH
  /:id` endpoint. 403 on non-owner, 404 on not-found, matching
  update/delete.
- **GraphQL**: `plantingSpotMarkFallow(input: PlantingSpotMarkFallowRequestDto):
  MutationResponseDto` and `plantingSpotMarkActive(...)`, each taking a
  single-field `{ id }` input DTO (same shape as `PlantingSpotDeleteRequestDto`)
  and returning the standard `MutationResponseDto` via
  `MutationResponseGraphQLMapper` — consistent with every other planting-spot
  mutation in this resolver (create/update/delete all return
  `MutationResponseDto`, not the full resource).
- **MCP**: two new tools, `planting_spot_mark_fallow` and
  `planting_spot_mark_active`, each with an `{ id: z.string().uuid() }`
  schema, dispatching the corresponding command with `spaceId`/`userId` read
  from `IMcpToolContext` (never from tool args) — same convention as every
  other tool in this context.
- `PlantingSpotStatusEnum` is registered via `registerEnumType` (GraphQL) so
  `status` can be returned on `PlantingSpotResponseDto`.

## No new cross-context coupling

This change touches only `src/contexts/planting-spots/`. It does not read from
or write to `plants`, `care-schedule`, or any other context.

## Follow-up (out of scope here)

Once this lands, `gardenia-web`'s `planting-spots` module gains the matching
use cases (`useMarkPlantingSpotFallow`, `useMarkPlantingSpotActive`) and UI
(status badge, a "Mark fallow" / "Reactivate" action on the detail screen) in
a separate change.
