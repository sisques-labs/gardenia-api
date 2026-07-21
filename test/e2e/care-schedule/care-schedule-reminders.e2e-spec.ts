import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';

import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { registerAndLogin } from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6380', 10);
const QUEUE_NAME = 'push-notifications';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'care-schedule-reminders@example.com';
const PLANT_ID = randomUUID();

describe('Care Schedule → push-notifications queue (e2e)', () => {
  let ctx: E2EContext;
  let inspectionQueue: Queue;

  beforeAll(async () => {
    ctx = await createE2EApp();
    inspectionQueue = new Queue(QUEUE_NAME, {
      connection: { host: REDIS_HOST, port: REDIS_PORT },
    });
  });

  afterAll(async () => {
    await inspectionQueue.obliterate({ force: true });
    await inspectionQueue.close();
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await inspectionQueue.obliterate({ force: true });
  });

  it('creating a schedule enqueues a reminder job for its nextDueAt', async () => {
    const { token, spaceId } = await registerAndLogin(ctx, EMAIL, PASSWORD);
    const dueAt = new Date(Date.now() + 60_000);

    const res = await ctx
      .http()
      .post('/api/care-schedules')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({
        plantId: PLANT_ID,
        activityType: 'WATERING',
        intervalDays: 3,
        nextDueAt: dueAt.toISOString(),
      })
      .expect(201);

    const scheduleId = res.body.id as string;

    const job = await inspectionQueue.getJob(scheduleId);
    expect(job).toBeDefined();
    expect(job!.data).toMatchObject({ userId: expect.any(String) });
    expect(job!.opts.delay).toBeGreaterThan(0);
    expect(job!.opts.delay).toBeLessThanOrEqual(60_000);
  });

  it('completing early replaces the pending job rather than duplicating it', async () => {
    const { token, spaceId } = await registerAndLogin(ctx, EMAIL, PASSWORD);

    const createRes = await ctx
      .http()
      .post('/api/care-schedules')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({
        plantId: PLANT_ID,
        activityType: 'WATERING',
        intervalDays: 3,
        nextDueAt: new Date(Date.now() + 60_000).toISOString(),
      })
      .expect(201);
    const scheduleId = createRes.body.id as string;

    const jobBeforeCompletion = await inspectionQueue.getJob(scheduleId);
    const delayBeforeCompletion = jobBeforeCompletion!.opts.delay;

    await ctx
      .http()
      .post(`/api/care-schedules/${scheduleId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({})
      .expect(200);

    const jobAfterCompletion = await inspectionQueue.getJob(scheduleId);
    expect(jobAfterCompletion).toBeDefined();
    // Recurring (intervalDays=3): the new due date is ~3 days out, so its
    // delay must be much larger than the original ~60s delay — proof the
    // old job was replaced with a new one for the new due date, not left
    // dangling alongside it.
    expect(jobAfterCompletion!.opts.delay).toBeGreaterThan(
      delayBeforeCompletion!,
    );
  });

  it('deleting a schedule cancels its pending reminder job', async () => {
    const { token, spaceId } = await registerAndLogin(ctx, EMAIL, PASSWORD);

    const createRes = await ctx
      .http()
      .post('/api/care-schedules')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({
        plantId: PLANT_ID,
        activityType: 'WATERING',
        intervalDays: 3,
        nextDueAt: new Date(Date.now() + 60_000).toISOString(),
      })
      .expect(201);
    const scheduleId = createRes.body.id as string;

    expect(await inspectionQueue.getJob(scheduleId)).toBeDefined();

    await ctx
      .http()
      .delete(`/api/care-schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .expect(200);

    expect(await inspectionQueue.getJob(scheduleId)).toBeUndefined();
  });

  it('deactivating a schedule cancels its pending reminder, reactivating it re-schedules', async () => {
    const { token, spaceId } = await registerAndLogin(ctx, EMAIL, PASSWORD);

    const createRes = await ctx
      .http()
      .post('/api/care-schedules')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({
        plantId: PLANT_ID,
        activityType: 'WATERING',
        intervalDays: 3,
        nextDueAt: new Date(Date.now() + 60_000).toISOString(),
      })
      .expect(201);
    const scheduleId = createRes.body.id as string;

    await ctx
      .http()
      .patch(`/api/care-schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({ active: false })
      .expect(200);

    expect(await inspectionQueue.getJob(scheduleId)).toBeUndefined();

    await ctx
      .http()
      .patch(`/api/care-schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Space-ID', spaceId!)
      .send({ active: true })
      .expect(200);

    expect(await inspectionQueue.getJob(scheduleId)).toBeDefined();
  });
});
