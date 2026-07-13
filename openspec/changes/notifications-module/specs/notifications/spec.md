# Notifications — Tenant-scoped, per-user in-app notification feed

**Source change:** notifications-module
**Created:** 2026-07-13

---

## Requirements

### Requirement: NotificationAggregate Fields and Validation

The `NotificationAggregate` MUST carry: `id` (UUID, generated), `type`
(`NotificationTypeEnum`), `referenceType` (`NotificationReferenceTypeEnum`),
`referenceId` (UUID, the id of the entity the notification is about),
`dedupeKey` (non-empty string, format `{type}:{referenceId}`), `payload`
(JSON object, display-ready snapshot data), `status`
(`NotificationStatusEnum`, default `UNREAD`), `readAt` (optional Date),
`resolvedAt` (optional Date), `userId` (UUID, the recipient), `spaceId`
(UUID, tenant scope), `createdAt`, `updatedAt`.

The system MUST reject a `dedupeKey` that does not start with `{type}:`.
The system MUST NOT allow `type`, `referenceType`, `referenceId`, or `payload`
to change after creation — the aggregate exposes no method to mutate them.

#### Scenario: Valid notification aggregate

- GIVEN type=CARE_SCHEDULE_DUE, referenceType=CARE_SCHEDULE, a valid referenceId, a non-empty payload
- WHEN a `NotificationAggregate` is built
- THEN all fields are set, `status` is `UNREAD`, `readAt` and `resolvedAt` are undefined, and the aggregate is valid

#### Scenario: Mismatched dedupeKey rejected

- GIVEN type=INVENTORY_LOW_STOCK and a dedupeKey starting with `"INVENTORY_EXPIRING_SOON:"`
- WHEN a `NotificationAggregate` is built
- THEN a domain validation error is thrown

---

### Requirement: NotificationTypeEnum

The system MUST support exactly: `CARE_SCHEDULE_DUE`, `INVENTORY_LOW_STOCK`,
`INVENTORY_EXPIRING_SOON`. Any value outside the set MUST be rejected at the
VO level.

#### Scenario: Valid type accepted

- GIVEN type value `"INVENTORY_LOW_STOCK"`
- WHEN `NotificationTypeValueObject` is constructed
- THEN no error is thrown

#### Scenario: Unknown type rejected

- GIVEN type value `"WEATHER_FROST_WARNING"`
- WHEN `NotificationTypeValueObject` is constructed
- THEN a domain validation error is thrown

---

### Requirement: Notification Lifecycle — Read/Unread and Resolved Are Independent Axes

`status` (`UNREAD`/`READ`) tracks whether the recipient has seen the
notification. `resolvedAt` tracks whether the underlying condition that
created the notification is still true. The two MUST be independent: marking
a notification read MUST NOT change `resolvedAt`, and resolving a
notification MUST NOT change `status`.

`markRead()` MUST be idempotent: calling it on an already-`READ` notification
MUST NOT change `readAt` and MUST NOT emit a new `NotificationReadEvent`.

`resolve()` MUST be idempotent: calling it on an already-resolved
notification MUST NOT change `resolvedAt` and MUST NOT emit a new
`NotificationResolvedEvent`.

#### Scenario: Marking read does not resolve

- GIVEN an unread, unresolved notification
- WHEN `markRead()` is called
- THEN `status` becomes `READ` and `resolvedAt` remains undefined

#### Scenario: Resolving does not mark read

- GIVEN an unread, unresolved notification
- WHEN `resolve()` is called
- THEN `resolvedAt` is set and `status` remains `UNREAD`

#### Scenario: Marking an already-read notification read again is a no-op

- GIVEN a notification already `READ` at time T1
- WHEN `markRead()` is called again at time T2
- THEN `readAt` is still T1 and no `NotificationReadEvent` is emitted

#### Scenario: Resolving an already-resolved notification is a no-op

- GIVEN a notification already resolved at time T1
- WHEN `resolve()` is called again at time T2
- THEN `resolvedAt` is still T1 and no `NotificationResolvedEvent` is emitted

---

### Requirement: MarkNotificationRead Command

`MarkNotificationReadCommand` MUST require an authenticated user and accept
`notificationId`. The handler MUST load the notification via the write
repository; if it does not exist (or does not belong to the active space),
it MUST throw `NotificationNotFoundException` (404). If it exists but its
`userId` does not match the authenticated user, it MUST throw
`NotificationNotOwnedException` (403) — a space member MUST NOT be able to
mark another member's notification as read.

#### Scenario: Owner marks own notification read

- GIVEN a notification belonging to user U in space S, currently unread
- WHEN U dispatches `MarkNotificationReadCommand` for it within space S
- THEN the notification's `status` becomes `READ`

#### Scenario: Non-owner rejected

- GIVEN a notification belonging to user U in space S
- WHEN a different member V of space S dispatches `MarkNotificationReadCommand` for it
- THEN `NotificationNotOwnedException` is thrown and the notification is unchanged

#### Scenario: Unknown id rejected

- GIVEN no notification exists with the given id in the active space
- WHEN `MarkNotificationReadCommand` is dispatched
- THEN `NotificationNotFoundException` is thrown

---

### Requirement: MarkAllNotificationsRead Command

`MarkAllNotificationsReadCommand` MUST require an authenticated user. The
handler MUST mark every currently-`UNREAD` notification belonging to that
user within the active space as `READ`. It MUST NOT affect notifications
belonging to other users, other spaces, or notifications already `READ`.

#### Scenario: All unread notifications marked read

- GIVEN user U has 3 unread and 2 already-read notifications in space S
- WHEN U dispatches `MarkAllNotificationsReadCommand` within space S
- THEN all 5 notifications are `READ`

#### Scenario: Other users unaffected

- GIVEN user U and user V both have unread notifications in space S
- WHEN U dispatches `MarkAllNotificationsReadCommand`
- THEN V's notifications remain unread

---

### Requirement: NotificationFindByCriteria Query

`NotificationFindByCriteriaQuery` MUST always scope results to the
authenticated user's own notifications within the active space — it MUST
NOT be possible to retrieve another user's notifications regardless of
filter values supplied. It MUST support optional filters `status`
(`NotificationStatusEnum`) and `type` (`NotificationTypeEnum`), and MUST
support pagination (`page`, `limit`, default page=1 limit=20, max limit=100).

#### Scenario: Default listing returns own notifications only

- GIVEN user U has notifications in space S and user V has notifications in space S
- WHEN U dispatches `NotificationFindByCriteriaQuery` with no filters
- THEN only U's notifications are returned

#### Scenario: Filter by status

- GIVEN user U has 2 unread and 3 read notifications
- WHEN U dispatches `NotificationFindByCriteriaQuery` with `status: UNREAD`
- THEN exactly the 2 unread notifications are returned

#### Scenario: Filter by type

- GIVEN user U has notifications of both `CARE_SCHEDULE_DUE` and `INVENTORY_LOW_STOCK`
- WHEN U dispatches `NotificationFindByCriteriaQuery` with `type: INVENTORY_LOW_STOCK`
- THEN only `INVENTORY_LOW_STOCK` notifications are returned

---

### Requirement: NotificationsUnreadCount Query

`NotificationsUnreadCountQuery` MUST return the count of the authenticated
user's `UNREAD` notifications within the active space. Resolved notifications
MUST still count while `UNREAD` — resolution and read-state are independent
per the lifecycle requirement above.

#### Scenario: Count reflects unread notifications regardless of resolution

- GIVEN user U has 2 unread+unresolved, 1 unread+resolved, and 3 read notifications
- WHEN U dispatches `NotificationsUnreadCountQuery`
- THEN the count returned is 3

---

### Requirement: Reconciliation — Condition Instance Identity via dedupeKey

Every condition source (a due care schedule, a low-stock item, an
item entering its expiry window) MUST map to a `dedupeKey` of
`{type}:{referenceId}`. The reconciliation command MUST be idempotent: given
an unchanged set of matching conditions, running it repeatedly MUST NOT
create additional notifications for a `dedupeKey` that already has an open
(`resolvedAt IS NULL`) notification for a given recipient.

#### Scenario: Repeated reconciliation does not duplicate

- GIVEN a care schedule due within the window, with an open `CARE_SCHEDULE_DUE` notification already existing for every active member
- WHEN `ReconcileSpaceNotificationsCommand` is dispatched again with no state change
- THEN no new notifications are created

#### Scenario: New condition creates notifications for every active member

- GIVEN a space with 2 active members and an inventory item that just crossed into low stock, with no existing open notification for it
- WHEN `ReconcileSpaceNotificationsCommand` is dispatched
- THEN one `INVENTORY_LOW_STOCK` notification is created per active member (2 total), both sharing the same `dedupeKey`

#### Scenario: Cleared condition resolves existing open notifications

- GIVEN open `CARE_SCHEDULE_DUE` notifications exist for a schedule that has since been completed (no longer due within the window)
- WHEN `ReconcileSpaceNotificationsCommand` is dispatched
- THEN every open notification sharing that schedule's `dedupeKey` is resolved (`resolvedAt` set), and their `status`/`readAt` are unchanged

#### Scenario: Condition re-opening after resolution creates a new notification

- GIVEN a previously low-stock item was restocked (its open notification was resolved), and it later drops below the threshold again
- WHEN `ReconcileSpaceNotificationsCommand` runs after the restock (no open notification, condition false) and again after the re-drop (condition true again)
- THEN no notification exists after the restock reconciliation, and a new open notification (same `dedupeKey`, new row) exists after the re-drop reconciliation

#### Scenario: One space's reconciliation failure does not affect others

- GIVEN two spaces, one of which raises an error while resolving alert sources
- WHEN the reconciliation job sweeps all spaces
- THEN the failing space is logged and skipped, and the other space's reconciliation still completes

---

### Requirement: Reconciliation Scope — Only Active Members Receive Notifications

The reconciliation command MUST fan out created notifications to every
currently active member of the space, resolved at the time of the
reconciliation run. A member removed from the space after a notification
was created MUST NOT retroactively lose or gain access to it (no cleanup of
existing rows on membership removal in v1).

#### Scenario: Fan-out matches current membership

- GIVEN a space with 3 active members and a new due care schedule
- WHEN `ReconcileSpaceNotificationsCommand` runs
- THEN exactly 3 notifications are created, one per active member

---

### Requirement: REST Transport

`GET /notifications` (criteria: `status`, `type`, `page`, `limit`),
`GET /notifications/unread-count`, `PATCH /notifications/:id/read`,
`POST /notifications/read-all` MUST all be guarded by `JwtAuthGuard` +
`SpaceGuard` and require the `X-Space-ID` header.

#### Scenario: Unauthenticated request rejected

- GIVEN no valid JWT
- WHEN any `/notifications` endpoint is called
- THEN a 401 response is returned

---

### Requirement: GraphQL Transport

`notificationsFindByCriteria` and `notificationsUnreadCount` queries, and
`notificationMarkRead` / `notificationsMarkAllRead` mutations MUST be
exposed, guarded identically to REST. `notificationsFindByCriteria` MUST use
the typed Criteria pattern (`NotificationFilterInput`/`NotificationSortInput`
validated via `FilterValidationPipe(notificationFilterableFields)`).

#### Scenario: Filtering by an unwhitelisted field rejected

- GIVEN a `notificationsFindByCriteria` filter referencing a field not in `NotificationQueryableField`
- WHEN the query is executed
- THEN the request is rejected by `FilterValidationPipe` before reaching the handler

---

### Requirement: Tenant and User Isolation

All reads and writes MUST be scoped to the active `spaceId` via
`createTenantRepository`. All reads and mutations of individual notifications
MUST additionally be scoped to the requesting user's own `userId` (see
MarkNotificationRead and NotificationFindByCriteria requirements above) —
space scoping alone is insufficient because a notification's recipient is a
single user, not the whole space.

#### Scenario: Cross-space notification invisible

- GIVEN a notification created in space S1
- WHEN a request scoped to space S2 queries notifications with the same authenticated user
- THEN the notification from S1 is not returned

---

### Requirement: No Cross-Context Coupling

`notifications` MUST NOT import `@contexts/care-schedule/domain`,
`@contexts/care-schedule/application`, `@contexts/inventory/domain`,
`@contexts/inventory/application`, `@contexts/users/domain`,
`@contexts/users/application`, `@contexts/spaces/domain`, or
`@contexts/spaces/application` anywhere outside
`notifications/infrastructure/adapters/`. `care-schedule`, `inventory`,
`users`, and `spaces` MUST NOT import anything from `notifications`.

#### Scenario: Boundary enforced by static test

- GIVEN the `notifications` context source tree
- WHEN the cross-context import static test scans it
- THEN no disallowed import is found outside `infrastructure/adapters/`
