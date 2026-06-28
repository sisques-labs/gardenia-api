import { RecordCareLogEntryInput } from '@contexts/care-schedule/application/ports/record-care-log-entry.input';

export const CARE_LOG_PORT = Symbol('CARE_LOG_PORT');

export interface ICareLogPort {
  /**
   * Records a care-log entry for a completed care activity. Implemented by an
   * adapter that translates to the care-log context via the Command bus.
   */
  recordCareLogEntry(input: RecordCareLogEntryInput): Promise<void>;
}
