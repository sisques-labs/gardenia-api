import { SensorTypeEnum } from '@contexts/nodes/domain/enums/sensor-type.enum';
import { parseTelemetryMessage } from './telemetry-message.parser';

const NODE_ID = '550e8400-e29b-41d4-a716-446655440000';
const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('parseTelemetryMessage', () => {
  it('parses a valid message', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      sensorType: SensorTypeEnum.SOIL_MOISTURE,
      value: 42.5,
      unit: '%',
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    const parsed = parseTelemetryMessage(raw);

    expect(parsed.nodeId).toBe(NODE_ID);
    expect(parsed.bridgeId).toBe(BRIDGE_ID);
    expect(parsed.sensorType).toBe(SensorTypeEnum.SOIL_MOISTURE);
    expect(parsed.value).toBe(42.5);
    expect(parsed.unit).toBe('%');
    expect(parsed.recordedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('defaults unit to null when absent', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      sensorType: SensorTypeEnum.RAIN,
      value: 1,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(parseTelemetryMessage(raw).unit).toBeNull();
  });

  it('throws on missing bridgeId (bridge not yet shipped by gardenia-bridge)', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      sensorType: SensorTypeEnum.RAIN,
      value: 1,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(() => parseTelemetryMessage(raw)).toThrow();
  });

  it('throws on an unknown sensorType', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      sensorType: 'NOT_A_SENSOR',
      value: 1,
      recordedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(() => parseTelemetryMessage(raw)).toThrow();
  });

  it('throws on null/unparsable raw value', () => {
    expect(() => parseTelemetryMessage(null)).toThrow();
  });
});
