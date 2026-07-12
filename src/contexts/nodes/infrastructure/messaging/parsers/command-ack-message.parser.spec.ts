import { parseCommandAckMessage } from './command-ack-message.parser';

const NODE_ID = '550e8400-e29b-41d4-a716-446655440000';
const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('parseCommandAckMessage', () => {
  it('parses a valid message with commandId', () => {
    const raw = JSON.stringify({
      commandId: 'cmd-1',
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      result: 'success',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });

    const parsed = parseCommandAckMessage(raw);

    expect(parsed.commandId).toBe('cmd-1');
    expect(parsed.result).toBe('success');
  });

  it('defaults commandId to null when absent (gardenia-bridge does not ship it yet)', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      bridgeId: BRIDGE_ID,
      result: 'success',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(parseCommandAckMessage(raw).commandId).toBeNull();
  });

  it('throws on missing bridgeId', () => {
    const raw = JSON.stringify({
      nodeId: NODE_ID,
      result: 'success',
      receivedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(() => parseCommandAckMessage(raw)).toThrow();
  });
});
