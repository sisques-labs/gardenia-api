import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

import { IReminderSchedulerPort } from '@contexts/care-schedule/application/ports/reminder-scheduler.port';
import { ScheduleReminderInput } from '@contexts/care-schedule/application/ports/schedule-reminder.input';

// Must match notifications' PUSH_NOTIFICATIONS_QUEUE constant. Deliberately
// not imported from @contexts/notifications — the queue is the contract
// between the two contexts, not a shared TypeScript type (see design.md).
const PUSH_NOTIFICATIONS_QUEUE = 'push-notifications';

@Injectable()
export class ReminderQueueAdapter implements IReminderSchedulerPort {
  private readonly logger = new Logger(ReminderQueueAdapter.name);

  constructor(
    @InjectQueue(PUSH_NOTIFICATIONS_QUEUE) private readonly queue: Queue,
  ) {}

  async scheduleReminder(input: ScheduleReminderInput): Promise<void> {
    const delay = Math.max(0, input.dueAt.getTime() - Date.now());

    // Replace semantics: remove any existing job for this schedule first so
    // rescheduling (e.g. on early completion) never leaves a stale job
    // behind alongside the new one.
    await this.cancelReminder(input.careScheduleId);

    await this.queue.add(
      'send',
      {
        userId: input.userId,
        title: 'Time to take care of your plant',
        body: `${input.activityType.toLowerCase()} is due`,
        url: `/plants/${input.plantId}`,
      },
      { jobId: input.careScheduleId, delay },
    );

    this.logger.log(
      `Scheduled reminder for care schedule ${input.careScheduleId} in ${delay}ms`,
    );
  }

  async cancelReminder(careScheduleId: string): Promise<void> {
    const existing = await this.queue.getJob(careScheduleId);
    if (existing) await existing.remove();
  }
}
