import { CommandBus } from '@nestjs/cqrs';
import { Job } from 'bullmq';

import { SendPushNotificationCommand } from '@contexts/notifications/application/commands/send-push-notification/send-push-notification.command';

import { PushNotificationsProcessor } from './push-notifications.processor';

describe('PushNotificationsProcessor', () => {
  let processor: PushNotificationsProcessor;
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    processor = new PushNotificationsProcessor(mockCommandBus);
  });

  it('dispatches SendPushNotificationCommand with the job data', async () => {
    const job = {
      id: 'job-1',
      data: {
        userId: '660e8400-e29b-41d4-a716-446655440001',
        title: 'Time to water your plant',
        body: 'watering is due',
        url: '/plants/770e8400-e29b-41d4-a716-446655440002',
      },
    } as Job<{
      userId: string;
      title: string;
      body: string;
      url?: string;
    }>;

    await processor.process(job);

    expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    const dispatched = mockCommandBus.execute.mock
      .calls[0][0] as SendPushNotificationCommand;
    expect(dispatched).toBeInstanceOf(SendPushNotificationCommand);
    expect(dispatched.userId.value).toBe(
      '660e8400-e29b-41d4-a716-446655440001',
    );
    expect(dispatched.title.value).toBe('Time to water your plant');
    expect(dispatched.url?.value).toBe(
      '/plants/770e8400-e29b-41d4-a716-446655440002',
    );
  });

  it('propagates an error from CommandBus so BullMQ can retry the job', async () => {
    mockCommandBus.execute.mockRejectedValue(new Error('unexpected failure'));
    const job = {
      id: 'job-2',
      data: {
        userId: '660e8400-e29b-41d4-a716-446655440001',
        title: 't',
        body: 'b',
      },
    } as Job<{ userId: string; title: string; body: string; url?: string }>;

    await expect(processor.process(job)).rejects.toThrow('unexpected failure');
  });
});
