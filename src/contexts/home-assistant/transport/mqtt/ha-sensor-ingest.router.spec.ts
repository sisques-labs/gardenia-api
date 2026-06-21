import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { ISensorIngestPort } from '@contexts/home-assistant/application/ports/sensor-ingest.port';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { HaSensorIngestRouter } from './ha-sensor-ingest.router';

function buildConfig(overrides: Partial<MqttConfig> = {}): MqttConfig {
  return {
    enabled: true,
    url: 'mqtt://broker:1883',
    baseTopic: 'gardenia',
    discoveryPrefix: 'homeassistant',
    reconcileIntervalMs: 60_000,
    bridgedSpaceIds: ['s1'],
    ...overrides,
  };
}

function buildHarness(config: MqttConfig = buildConfig()) {
  let handler: ((topic: string, payload: Buffer) => void) | undefined;
  const subscribe = jest.fn(
    (_f: string, h: (topic: string, payload: Buffer) => void) => {
      handler = h;
      return Promise.resolve();
    },
  );
  const ingestPort = {
    recordReading: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<ISensorIngestPort>;
  const configService = {
    getOrThrow: jest.fn().mockReturnValue(config),
  } as unknown as ConfigService;
  const spaceContext = {
    run: jest.fn((_s: string, fn: () => unknown) => fn()),
  } as unknown as SpaceContext;

  const router = new HaSensorIngestRouter(
    configService,
    { subscribe } as unknown as MqttService,
    spaceContext,
    ingestPort,
  );

  return {
    router,
    ingestPort,
    subscribe,
    emit: async (topic: string, payload: string) => {
      handler?.(topic, Buffer.from(payload));
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

describe('HaSensorIngestRouter', () => {
  it('subscribes to the reading filter on init', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    expect(h.subscribe).toHaveBeenCalledWith(
      'gardenia/+/plant/+/+/reading',
      expect.any(Function),
    );
  });

  it('ingests a numeric reading mapped to plant + metric', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/plant/p1/moisture/reading', '42.5');
    expect(h.ingestPort.recordReading).toHaveBeenCalledWith(
      's1',
      'p1',
      'moisture',
      42.5,
    );
  });

  it('ignores readings for a non-bridged space', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/other/plant/p1/moisture/reading', '42.5');
    expect(h.ingestPort.recordReading).not.toHaveBeenCalled();
  });

  it('ignores a non-numeric reading', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/plant/p1/moisture/reading', 'wet');
    expect(h.ingestPort.recordReading).not.toHaveBeenCalled();
  });
});
