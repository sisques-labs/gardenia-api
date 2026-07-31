import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';

import { ReminderQueueAdapter } from '@contexts/care-schedule/infrastructure/adapters/reminder-queue.adapter';

const REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT ?? '6380', 10);
const QUEUE_NAME = 'push-notifications';

describe('ReminderQueueAdapter (integration, real Redis)', () => {
  let queue: Queue;
  let adapter: ReminderQueueAdapter;

  beforeAll(() => {
    queue = new Queue(QUEUE_NAME, {
      connection: { host: REDIS_HOST, port: REDIS_PORT },
    });
    adapter = new ReminderQueueAdapter(queue);
  });

  afterAll(async () => {
    await queue.obliterate({ force: true });
    await queue.close();
  });

  it('a scheduled job becomes available once its delay elapses', async () => {
    const careScheduleId = randomUUID();

    await adapter.scheduleReminder({
      careScheduleId,
      userId: randomUUID(),
      plantId: randomUUID(),
      activityType: 'WATERING',
      dueAt: new Date(Date.now() + 300),
    });

    const jobRightAfterSchedule = await queue.getJob(careScheduleId);
    expect(jobRightAfterSchedule).toBeDefined();
    expect(await jobRightAfterSchedule!.isDelayed()).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 600));

    const jobAfterDelay = await queue.getJob(careScheduleId);
    expect(jobAfterDelay).toBeDefined();
    expect(await jobAfterDelay!.isDelayed()).toBe(false);

    await jobAfterDelay!.remove();
  });

  it('replacing a job by id leaves exactly one job for that schedule', async () => {
    const careScheduleId = randomUUID();

    await adapter.scheduleReminder({
      careScheduleId,
      userId: randomUUID(),
      plantId: randomUUID(),
      activityType: 'WATERING',
      dueAt: new Date(Date.now() + 60_000),
    });
    await adapter.scheduleReminder({
      careScheduleId,
      userId: randomUUID(),
      plantId: randomUUID(),
      activityType: 'FERTILIZING',
      dueAt: new Date(Date.now() + 120_000),
    });

    const job = await queue.getJob(careScheduleId);
    expect(job).toBeDefined();
    expect((job!.data as { title: string }).title).toContain(
      'take care of your plant',
    );
    expect(job!.opts.delay).toBeGreaterThan(60_000);

    await job!.remove();
  });

  it('cancelReminder removes a pending job', async () => {
    const careScheduleId = randomUUID();
    await adapter.scheduleReminder({
      careScheduleId,
      userId: randomUUID(),
      plantId: randomUUID(),
      activityType: 'WATERING',
      dueAt: new Date(Date.now() + 60_000),
    });

    await adapter.cancelReminder(careScheduleId);

    const job = await queue.getJob(careScheduleId);
    expect(job).toBeUndefined();
  });

  it('cancelReminder no-ops when no job exists for the id', async () => {
    await expect(adapter.cancelReminder(randomUUID())).resolves.not.toThrow();
  });
});
