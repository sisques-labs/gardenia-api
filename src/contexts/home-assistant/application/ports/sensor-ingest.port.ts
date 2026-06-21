export const SENSOR_INGEST_PORT = Symbol('SENSOR_INGEST_PORT');

/**
 * Ingest side of the bridge: persists a physical sensor reading received from
 * Home Assistant. The adapter dispatches a `RecordSensorReadingCommand`.
 */
export interface ISensorIngestPort {
  recordReading(
    spaceId: string,
    plantId: string,
    metric: string,
    value: number,
    unit?: string,
  ): Promise<void>;
}
