import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { registerAndLogin } from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'push-subscriptions-rest@example.com';

describe('Push Subscriptions REST (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('POST /api/push-subscriptions', () => {
    it('registers a subscription without requiring X-Space-ID', async () => {
      const { token } = await registerAndLogin(ctx, EMAIL, PASSWORD);

      const res = await ctx
        .http()
        .post('/api/push-subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          p256dh: 'p256dh-key',
          auth: 'auth-secret',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('string');
    });

    it('returns 401 without a valid JWT', async () => {
      await ctx
        .http()
        .post('/api/push-subscriptions')
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
          p256dh: 'p256dh-key',
          auth: 'auth-secret',
        })
        .expect(401);
    });

    it('upserts when the same endpoint is registered again', async () => {
      const { token } = await registerAndLogin(ctx, EMAIL, PASSWORD);
      const endpoint = 'https://fcm.googleapis.com/fcm/send/upsert-me';

      const first = await ctx
        .http()
        .post('/api/push-subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ endpoint, p256dh: 'old-key', auth: 'old-auth' })
        .expect(201);

      const second = await ctx
        .http()
        .post('/api/push-subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ endpoint, p256dh: 'new-key', auth: 'new-auth' })
        .expect(201);

      expect(second.body.id).toBe(first.body.id);

      const rows = await ctx.dataSource.query(
        'SELECT * FROM push_subscriptions WHERE endpoint = $1',
        [endpoint],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].p256dh).toBe('new-key');
    });

    it('rejects a request with a missing field', async () => {
      const { token } = await registerAndLogin(ctx, EMAIL, PASSWORD);

      await ctx
        .http()
        .post('/api/push-subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({ endpoint: 'https://fcm.googleapis.com/fcm/send/abc123' })
        .expect(400);
    });
  });

  describe('DELETE /api/push-subscriptions/:id', () => {
    it('unregisters an existing subscription', async () => {
      const { token } = await registerAndLogin(ctx, EMAIL, PASSWORD);
      const created = await ctx
        .http()
        .post('/api/push-subscriptions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          endpoint: 'https://fcm.googleapis.com/fcm/send/delete-me',
          p256dh: 'p256dh-key',
          auth: 'auth-secret',
        })
        .expect(201);

      await ctx
        .http()
        .delete(`/api/push-subscriptions/${created.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const rows = await ctx.dataSource.query(
        'SELECT * FROM push_subscriptions WHERE id = $1',
        [created.body.id],
      );
      expect(rows).toHaveLength(0);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await registerAndLogin(ctx, EMAIL, PASSWORD);

      await ctx
        .http()
        .delete('/api/push-subscriptions/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 401 without a valid JWT', async () => {
      await ctx
        .http()
        .delete('/api/push-subscriptions/00000000-0000-4000-8000-000000000000')
        .expect(401);
    });
  });
});
