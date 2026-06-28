import { randomUUID } from 'crypto';

import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'care-schedule-user-a@example.com';
const EMAIL_B = 'care-schedule-user-b@example.com';

const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000099';
const PLANT_ID = randomUUID();

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await ctx
    .http()
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);

  const { spaceId } = regRes.body as { spaceId: string };

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId };
}

const VALID_SCHEDULE = {
  plantId: PLANT_ID,
  activityType: 'WATERING',
  intervalDays: 3,
  nextDueAt: '2026-06-27T00:00:00.000Z',
};

describe('Care Schedule REST API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    userA = await seedAuth(ctx, EMAIL_A, PASSWORD);
    userB = await seedAuth(ctx, EMAIL_B, PASSWORD);
  });

  describe('POST /api/care-schedules', () => {
    it('201 — creates a schedule and returns it', async () => {
      const res = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_SCHEDULE)
        .expect(201);

      expect(res.body).toMatchObject({
        plantId: PLANT_ID,
        activityType: 'WATERING',
        intervalDays: 3,
        active: true,
        spaceId: userA.spaceId,
      });
      expect(res.body.id).toBeDefined();
    });

    it('201 — creates a one-time schedule when intervalDays is omitted', async () => {
      const { intervalDays, ...oneTime } = VALID_SCHEDULE;
      void intervalDays;
      const res = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(oneTime)
        .expect(201);

      expect(res.body.intervalDays).toBeNull();
      expect(new Date(res.body.nextDueAt)).toEqual(
        new Date('2026-06-27T00:00:00.000Z'),
      );
    });

    it('400 — rejects interval below one', async () => {
      await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_SCHEDULE, intervalDays: 0 })
        .expect(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .post('/api/care-schedules')
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_SCHEDULE)
        .expect(401);
    });
  });

  describe('POST /api/care-schedules/:id/complete', () => {
    it('200 — advances nextDueAt by the interval', async () => {
      const createRes = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_SCHEDULE)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .post(`/api/care-schedules/${id}/complete`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ completedAt: '2026-06-27T00:00:00.000Z' })
        .expect(200);

      expect(new Date(res.body.nextDueAt)).toEqual(
        new Date('2026-06-30T00:00:00.000Z'),
      );
      expect(res.body.lastCompletedAt).not.toBeNull();
    });

    it('200 — completing a one-time schedule deactivates it and keeps nextDueAt', async () => {
      const { intervalDays, ...oneTime } = VALID_SCHEDULE;
      void intervalDays;
      const createRes = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(oneTime)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .post(`/api/care-schedules/${id}/complete`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ completedAt: '2026-06-27T09:00:00.000Z' })
        .expect(200);

      expect(res.body.active).toBe(false);
      expect(new Date(res.body.nextDueAt)).toEqual(
        new Date('2026-06-27T00:00:00.000Z'),
      );
      expect(res.body.lastCompletedAt).not.toBeNull();
    });
  });

  describe('GET /api/care-schedules', () => {
    it('200 — filters by dueBefore', async () => {
      await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_SCHEDULE, nextDueAt: '2026-06-28T00:00:00.000Z' })
        .expect(201);

      await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_SCHEDULE, nextDueAt: '2026-07-15T00:00:00.000Z' })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/care-schedules?dueBefore=2026-06-30T00:00:00.000Z')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
    });

    it('200 — returns empty list when space has no schedules', async () => {
      const res = await ctx
        .http()
        .get('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('GET /api/care-schedules/:id', () => {
    it('404 — tenant isolation: schedule from another space returns 404', async () => {
      const createRes = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_SCHEDULE)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .get(`/api/care-schedules/${id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(404);
    });
  });

  describe('PATCH /api/care-schedules/:id', () => {
    it('404 — returns 404 for unknown schedule', async () => {
      await ctx
        .http()
        .patch(`/api/care-schedules/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ intervalDays: 7 })
        .expect(404);
    });
  });

  describe('DELETE /api/care-schedules/:id', () => {
    it('200 — deletes a schedule', async () => {
      const createRes = await ctx
        .http()
        .post('/api/care-schedules')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_SCHEDULE)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/care-schedules/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      await ctx
        .http()
        .get(`/api/care-schedules/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
