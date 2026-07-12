/**
 * Whitelist of `NodeTelemetryReading` fields a client can filter/sort by via
 * `nodeTelemetryReadingsFindByCriteria`. `spaceId` excluded (implicit via
 * active Space).
 */
export enum NodeTelemetryReadingQueryableField {
  ID = 'id',
  NODE_ID = 'nodeId',
  SENSOR_TYPE = 'sensorType',
  VALUE = 'value',
  UNIT = 'unit',
  RECORDED_AT = 'recordedAt',
}
