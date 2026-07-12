import { parseHeartbeatMessage } from './heartbeat-message.parser';

const NODE_ID = '550e8400-e29b-41d4-a716-446655440000';
const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('parseHeartbeatMessage', () => {
  it('parses a valid message', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      seenAt: '2026-01-01T00:00:00.000Z',
    });

    const parsed = parseHeartbeatMessage(raw);

    expect(parsed.nodeId).toBe(NODE_ID);
    expect(parsed.bridgeId).toBe(BRIDGE_ID);
    expect(parsed.seenAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
  });

  it('throws on missing bridgeId', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      seenAt: '2026-01-01T00:00:00.000Z',
    });
    expect(() => parseHeartbeatMessage(raw)).toThrow();
  });

  it('throws on null raw value', () => {
    expect(() => parseHeartbeatMessage(null)).toThrow();
  });
});
