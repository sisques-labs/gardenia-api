# Notifications — Web Push subscriptions and delivery

**Source change:** care-schedule-push-reminders
**Created:** 2026-07-21

---

## Requirements

### Requirement: PushSubscriptionAggregate Fields and Validation

The `PushSubscriptionAggregate` MUST carry: `id` (UUID, generated), `userId`
(UUID, the owner), `endpoint` (non-empty string, globally unique),
`p256dh` (non-empty string), `auth` (non-empty string), `userAgent`
(optional string), `createdAt`, `updatedAt`.

The aggregate MUST NOT carry `spaceId` — push subscriptions are not
tenant-scoped.

The system MUST reject `endpoint`, `p256dh`, or `auth` that are empty or
whitespace-only.

#### Scenario: Valid subscription

- GIVEN a non-empty endpoint, p256dh, and auth
- WHEN a `PushSubscriptionAggregate` is built
- THEN all fields are set and the aggregate is valid

#### Scenario: Empty endpoint rejected

- GIVEN an empty endpoint
- WHEN a `PushSubscriptionAggregate` is built
- THEN a domain validation error is thrown

#### Scenario: userAgent omitted

- GIVEN no userAgent
- WHEN a `PushSubscriptionAggregate` is built
- THEN userAgent is undefined and the aggregate is valid

---

### Requirement: RegisterPushSubscription Command

Any authenticated user MAY register a push subscription for themselves.
`userId` MUST come from `@CurrentUser` — never from the request payload.

If `endpoint` already exists for ANY user, the handler MUST update that
existing row's `userId`, `p256dh`, `auth`, and `userAgent` (upsert) rather
than creating a duplicate or rejecting the request. This update path MUST
NOT emit `PushSubscriptionRegistered` again — only a true creation does.

If `endpoint` does not exist, the handler MUST create a new subscription and
emit `PushSubscriptionRegistered`.

This command MUST NOT require a `X-Space-ID` header (`@SkipSpace()`); it MUST
still require a valid JWT.

#### Scenario: New subscription created

- GIVEN an authenticated user and an endpoint not previously registered
- WHEN `RegisterPushSubscription` is dispatched
- THEN a `PushSubscriptionAggregate` is persisted and `PushSubscriptionRegistered` is emitted

#### Scenario: Re-registering the same endpoint upserts

- GIVEN an existing subscription for endpoint E under user A
- WHEN `RegisterPushSubscription` is dispatched for endpoint E with user B's credentials (e.g. shared device, different login)
- THEN the existing row is updated to `userId = B` with the new keys, no second row is created, and no `PushSubscriptionRegistered` event fires

#### Scenario: Missing JWT rejected

- GIVEN no Authorization header
- WHEN `POST /push-subscriptions` is called
- THEN 401 Unauthorized is returned

#### Scenario: Missing X-Space-ID does not block the request

- GIVEN an authenticated user with no `X-Space-ID` header
- WHEN `RegisterPushSubscription` is dispatched
- THEN the request succeeds (no space required)

---

### Requirement: UnregisterPushSubscription Command

Any authenticated user MAY unregister a push subscription. The handler MUST
load the subscription; if not found, throw `PushSubscriptionNotFoundException`
(404). On success it MUST emit `PushSubscriptionUnregistered` and delete the
row.

#### Scenario: Owner unregisters

- GIVEN a subscription owned by the authenticated user
- WHEN `UnregisterPushSubscription` is dispatched with its id
- THEN the subscription is deleted and `PushSubscriptionUnregistered` is emitted

#### Scenario: Not found

- GIVEN an id that does not exist
- WHEN `UnregisterPushSubscription` is dispatched
- THEN `PushSubscriptionNotFoundException` is thrown and 404 is returned

---

### Requirement: SendPushNotification Command (internal-only)

`SendPushNotificationCommand` accepts `userId`, `title`, `body`, and an
optional `url`. Its handler MUST load all of `userId`'s subscriptions and
attempt delivery to each independently — one subscription's failure MUST NOT
prevent delivery to the user's other subscriptions.

If a user has zero subscriptions, the handler MUST no-op successfully (not an
error).

If delivery to a subscription fails with an HTTP status of `404` or `410`
(subscription gone), the handler MUST dispatch
`UnregisterPushSubscriptionCommand` for that subscription. Other failures
MUST be logged and skipped, without unregistering.

This command MUST NOT be reachable via REST, GraphQL, or any MCP tool. It is
reachable exclusively via internal `CommandBus.execute()` calls from other
bounded contexts' `infrastructure/adapters/`.

#### Scenario: Delivers to all subscriptions

- GIVEN a user with two active subscriptions
- WHEN `SendPushNotificationCommand` is dispatched for that user
- THEN `IPushSenderPort.send()` is called once per subscription

#### Scenario: No subscriptions is a no-op

- GIVEN a user with zero subscriptions
- WHEN `SendPushNotificationCommand` is dispatched
- THEN the handler completes successfully without calling the sender port

#### Scenario: One failing subscription does not block another

- GIVEN a user with subscription A (will fail) and subscription B (will succeed)
- WHEN `SendPushNotificationCommand` is dispatched
- THEN delivery to B still succeeds despite A's failure

#### Scenario: Expired subscription self-unregisters

- GIVEN a subscription whose push service responds with HTTP 410
- WHEN delivery is attempted
- THEN `UnregisterPushSubscriptionCommand` is dispatched for that subscription

#### Scenario: No transport exposure

- GIVEN the source tree under `src/contexts/notifications/transport/`
- WHEN scanned for references to `SendPushNotificationCommand`
- THEN no REST controller, GraphQL resolver, or MCP tool references it

---

### Requirement: REST Transport

The system MUST expose, guarded by `JwtAuthGuard` only (`@SkipSpace()`, no
`X-Space-ID` required):

| Method | Path | Handler | Success Code |
|--------|------|---------|---------------|
| POST | /push-subscriptions | RegisterPushSubscription | 201 |
| DELETE | /push-subscriptions/:id | UnregisterPushSubscription | 200 |

`@CurrentUser` supplies `userId`.

---

### Requirement: GraphQL Transport

The system MUST expose, guarded the same way as REST:

**Mutations**: `registerPushSubscription(input: RegisterPushSubscriptionInput!): MutationResponseDto`,
`unregisterPushSubscription(id: ID!): MutationResponseDto`

Both resolvers MUST dispatch exclusively via `CommandBus`.

---

### Requirement: No Cross-Context Coupling

The `notifications` bounded context MUST NOT import from any other bounded
context's `domain`, `application`, or `transport`.

#### Scenario: No forbidden imports

- GIVEN the source tree under `src/contexts/notifications/`
- WHEN scanned for imports
- THEN no import path matches `@contexts/{other}/`

---

## Out of Scope

- Email or any non-push channel.
- Per-user notification preferences, quiet hours, opt-out granularity.
- A public "list my subscriptions" query.
- Retry/backoff for failed deliveries.
- VAPID key rotation tooling.
