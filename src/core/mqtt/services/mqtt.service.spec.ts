import { ConfigService } from '@nestjs/config';
import { connect } from 'mqtt';

import { MqttConfig } from '@core/config/mqtt.config';

import { MqttMessageHandler } from '../interfaces/mqtt-message-handler.type';
import { MqttService } from './mqtt.service';

jest.mock('mqtt', () => ({ connect: jest.fn() }));

const connectMock = connect as jest.MockedFunction<typeof connect>;

type Listener = (...args: unknown[]) => void;

interface FakeClient {
  connected: boolean;
  on: jest.Mock;
  publish: jest.Mock;
  subscribe: jest.Mock;
  end: jest.Mock;
  emit: (event: string, ...args: unknown[]) => void;
}

function createFakeClient(): FakeClient {
  const listeners = new Map<string, Listener[]>();
  return {
    connected: false,
    on: jest.fn((event: string, listener: Listener) => {
      const existing = listeners.get(event) ?? [];
      existing.push(listener);
      listeners.set(event, existing);
    }),
    publish: jest.fn(
      (_t: string, _m: unknown, _o: unknown, cb: (e?: Error) => void) => cb(),
    ),
    subscribe: jest.fn((_f: string, _o: unknown, cb: (e?: Error) => void) =>
      cb(),
    ),
    end: jest.fn((_force: boolean, _opts: unknown, cb: () => void) => cb()),
    emit: (event, ...args) =>
      (listeners.get(event) ?? []).forEach((l) => l(...args)),
  };
}

function buildConfig(overrides: Partial<MqttConfig> = {}): MqttConfig {
  return {
    enabled: true,
    url: 'mqtt://broker:1883',
    username: 'svc',
    password: 'secret',
    baseTopic: 'gardenia',
    discoveryPrefix: 'homeassistant',
    reconcileIntervalMs: 1000,
    ...overrides,
  };
}

function buildService(config: MqttConfig): MqttService {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue(config),
  } as unknown as ConfigService;
  return new MqttService(configService);
}

describe('MqttService', () => {
  let client: FakeClient;

  beforeEach(() => {
    jest.clearAllMocks();
    client = createFakeClient();
    connectMock.mockReturnValue(client as never);
  });

  describe('when disabled', () => {
    it('does not connect on init', () => {
      const service = buildService(buildConfig({ enabled: false }));
      service.onModuleInit();
      expect(connectMock).not.toHaveBeenCalled();
      expect(service.enabled).toBe(false);
    });

    it('publish is a no-op', async () => {
      const service = buildService(buildConfig({ enabled: false }));
      service.onModuleInit();
      await expect(service.publish('t', { a: 1 })).resolves.toBeUndefined();
      expect(client.publish).not.toHaveBeenCalled();
    });
  });

  describe('when enabled', () => {
    it('warns and does not connect without a URL', () => {
      const service = buildService(buildConfig({ url: undefined }));
      service.onModuleInit();
      expect(connectMock).not.toHaveBeenCalled();
    });

    it('connects with credentials and an offline LWT', () => {
      const service = buildService(buildConfig());
      service.onModuleInit();
      expect(connectMock).toHaveBeenCalledWith(
        'mqtt://broker:1883',
        expect.objectContaining({
          username: 'svc',
          password: 'secret',
          will: expect.objectContaining({
            topic: 'gardenia/bridge/availability',
            retain: true,
          }),
        }),
      );
    });

    it('publishes "online" (retained) on connect', () => {
      const service = buildService(buildConfig());
      service.onModuleInit();
      client.emit('connect');
      expect(client.publish).toHaveBeenCalledWith(
        'gardenia/bridge/availability',
        'online',
        expect.objectContaining({ retain: true }),
        expect.any(Function),
      );
    });

    it('JSON-serializes object payloads and forwards retain/qos', async () => {
      const service = buildService(buildConfig());
      service.onModuleInit();
      await service.publish(
        'gardenia/s1/plant/p1/state',
        { health: 'ok' },
        {
          retain: true,
          qos: 1,
        },
      );
      expect(client.publish).toHaveBeenCalledWith(
        'gardenia/s1/plant/p1/state',
        JSON.stringify({ health: 'ok' }),
        { retain: true, qos: 1 },
        expect.any(Function),
      );
    });

    it('routes incoming messages to a matching subscription only', async () => {
      const service = buildService(buildConfig());
      service.onModuleInit();
      const handler: MqttMessageHandler = jest.fn();
      await service.subscribe('gardenia/s1/plant/+/set', handler);

      client.emit('message', 'gardenia/s1/plant/p1/set', Buffer.from('1'));
      client.emit('message', 'gardenia/s2/plant/p1/set', Buffer.from('1'));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        'gardenia/s1/plant/p1/set',
        Buffer.from('1'),
      );
    });

    it('re-applies queued subscriptions on (re)connect', async () => {
      const service = buildService(buildConfig());
      service.onModuleInit();
      await service.subscribe('gardenia/s1/#', jest.fn());
      client.subscribe.mockClear();
      client.emit('connect');
      expect(client.subscribe).toHaveBeenCalledWith(
        'gardenia/s1/#',
        { qos: 1 },
        expect.any(Function),
      );
    });
  });
});
