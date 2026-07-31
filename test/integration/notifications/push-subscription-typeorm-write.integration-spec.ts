import { randomUUID } from 'crypto';

import { NotificationsModule } from '@contexts/notifications/notifications.module';
import { PushSubscriptionBuilder } from '@contexts/notifications/domain/builders/push-subscription.builder';
import {
  IPushSubscriptionWriteRepository,
  PUSH_SUBSCRIPTION_WRITE_REPOSITORY,
} from '@contexts/notifications/domain/repositories/write/push-subscription-write.repository';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildSubscription(
  overrides: {
    userId?: string;
    endpoint?: string;
  } = {},
) {
  return new PushSubscriptionBuilder()
    .withId(randomUUID())
    .withUserId(overrides.userId ?? randomUUID())
    .withEndpoint(
      overrides.endpoint ??
        `https://fcm.googleapis.com/fcm/send/${randomUUID()}`,
    )
    .withP256dh('p256dh-key')
    .withAuth('auth-secret')
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PushSubscriptionTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPushSubscriptionWriteRepository;

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [NotificationsModule] });
    writeRepo = ctx.module.get(PUSH_SUBSCRIPTION_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('round-trips a subscription through save/findById', async () => {
    const subscription = buildSubscription();

    const saved = await writeRepo.save(subscription);
    const found = await writeRepo.findById(saved.id.value);

    expect(found).not.toBeNull();
    expect(found!.endpoint.value).toBe(subscription.endpoint.value);
    expect(found!.userId.value).toBe(subscription.userId.value);
  });

  it('finds a subscription by endpoint', async () => {
    const endpoint = `https://fcm.googleapis.com/fcm/send/${randomUUID()}`;
    const subscription = buildSubscription({ endpoint });
    await writeRepo.save(subscription);

    const found = await writeRepo.findByEndpoint(endpoint);

    expect(found).not.toBeNull();
    expect(found!.endpoint.value).toBe(endpoint);
  });

  it('returns null from findByEndpoint when no subscription matches', async () => {
    const found = await writeRepo.findByEndpoint(
      'https://fcm.googleapis.com/fcm/send/does-not-exist',
    );

    expect(found).toBeNull();
  });

  it('enforces the unique constraint on endpoint', async () => {
    const endpoint = `https://fcm.googleapis.com/fcm/send/${randomUUID()}`;
    await writeRepo.save(buildSubscription({ endpoint }));

    await expect(
      writeRepo.save(buildSubscription({ endpoint })),
    ).rejects.toThrow();
  });

  it('finds all subscriptions for a user, and only that user', async () => {
    const userId = randomUUID();
    const otherUserId = randomUUID();
    await writeRepo.save(buildSubscription({ userId }));
    await writeRepo.save(buildSubscription({ userId }));
    await writeRepo.save(buildSubscription({ userId: otherUserId }));

    const found = await writeRepo.findByUserId(userId);

    expect(found).toHaveLength(2);
    expect(found.every((s) => s.userId.value === userId)).toBe(true);
  });

  it('deletes a subscription', async () => {
    const subscription = await writeRepo.save(buildSubscription());

    await writeRepo.delete(subscription.id.value);

    const found = await writeRepo.findById(subscription.id.value);
    expect(found).toBeNull();
  });

  it('is not tenant-scoped — subscriptions are visible regardless of space context', async () => {
    // Unlike every other repository in this codebase, this one has no
    // createTenantRepository wrapping — verify a save/read round-trip
    // succeeds with no active SpaceContext at all.
    const subscription = buildSubscription();

    const saved = await writeRepo.save(subscription);
    const found = await writeRepo.findById(saved.id.value);

    expect(found).not.toBeNull();
  });
});
