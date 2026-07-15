import { CareScheduleDueWindowHoursValueObject } from '@contexts/care-schedule/domain/value-objects/care-schedule-due-window-hours/care-schedule-due-window-hours.value-object';

export type CheckDueCareSchedulesCommandInput = {
  windowHours: number;
};

/**
 * Internal command — no REST/GraphQL/MCP surface. Dispatched exclusively by
 * CareScheduleDueReconciliationJob, always within a SpaceContext.run() scope.
 * Detects newly-due schedules and tells notifications about them; resolving
 * a schedule that's no longer due happens event-driven, in
 * complete/update/delete-care-schedule handlers — see design.md.
 */
export class CheckDueCareSchedulesCommand {
  public readonly windowHours: CareScheduleDueWindowHoursValueObject;

  constructor(input: CheckDueCareSchedulesCommandInput) {
    this.windowHours = new CareScheduleDueWindowHoursValueObject(
      input.windowHours,
    );
  }
}
