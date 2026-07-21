import { Queue } from 'bullmq';

import { ReminderQueueAdapter } from './reminder-queue.adapter';

describe('ReminderQueueAdapter', () => {
  let adapter: ReminderQueueAdapter;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    mockQueue = {
      add: jest.fn(),
      getJob: jest.fn(),
    } as unknown as jest.Mocked<Queue>;

    adapter = new ReminderQueueAdapter(mockQueue);
  });

  describe('scheduleReminder', () => {
    it('removes an existing job for the schedule before adding the new one', async () => {
      const existingJob = { remove: jest.fn() };
      mockQueue.getJob.mockResolvedValue(existingJob as never);

      const dueAt = new Date(Date.now() + 60_000);
      await adapter.scheduleReminder({
        careScheduleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
        plantId: '770e8400-e29b-41d4-a716-446655440002',
        activityType: 'WATERING',
        dueAt,
      });

      expect(existingJob.remove).toHaveBeenCalledTimes(1);
      expect(mockQueue.add).toHaveBeenCalledTimes(1);
      const [name, payload, options] = mockQueue.add.mock.calls[0];
      expect(name).toBe('send');
      expect(payload).toMatchObject({
        userId: '660e8400-e29b-41d4-a716-446655440001',
        url: '/plants/770e8400-e29b-41d4-a716-446655440002',
      });
      expect(options?.jobId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('clamps the delay at 0 for a due date already in the past', async () => {
      mockQueue.getJob.mockResolvedValue(undefined);

      await adapter.scheduleReminder({
        careScheduleId: '550e8400-e29b-41d4-a716-446655440000',
        userId: '660e8400-e29b-41d4-a716-446655440001',
        plantId: '770e8400-e29b-41d4-a716-446655440002',
        activityType: 'WATERING',
        dueAt: new Date(Date.now() - 60_000),
      });

      const [, , options] = mockQueue.add.mock.calls[0];
      expect(options?.delay).toBe(0);
    });

    it('does not fail when there is no existing job to remove', async () => {
      mockQueue.getJob.mockResolvedValue(undefined);

      await expect(
        adapter.scheduleReminder({
          careScheduleId: '550e8400-e29b-41d4-a716-446655440000',
          userId: '660e8400-e29b-41d4-a716-446655440001',
          plantId: '770e8400-e29b-41d4-a716-446655440002',
          activityType: 'WATERING',
          dueAt: new Date(),
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('cancelReminder', () => {
    it('removes the job when one exists', async () => {
      const existingJob = { remove: jest.fn() };
      mockQueue.getJob.mockResolvedValue(existingJob as never);

      await adapter.cancelReminder('550e8400-e29b-41d4-a716-446655440000');

      expect(existingJob.remove).toHaveBeenCalledTimes(1);
    });

    it('no-ops when no job exists', async () => {
      mockQueue.getJob.mockResolvedValue(undefined);

      await expect(
        adapter.cancelReminder('550e8400-e29b-41d4-a716-446655440000'),
      ).resolves.not.toThrow();
    });
  });
});
