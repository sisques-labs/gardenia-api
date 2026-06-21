import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { IHaWritePort } from '@contexts/home-assistant/application/ports/ha-write.port';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { HaCommandRouter } from './ha-command.router';

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

interface Harness {
  router: HaCommandRouter;
  writePort: jest.Mocked<IHaWritePort>;
  subscribe: jest.Mock;
  /** Feeds a message to the registered subscription handler. */
  emit: (topic: string, payload: string) => Promise<void>;
}

function buildHarness(config: MqttConfig = buildConfig()): Harness {
  let handler: ((topic: string, payload: Buffer) => void) | undefined;
  const subscribe = jest.fn(
    (_filter: string, h: (topic: string, payload: Buffer) => void) => {
      handler = h;
      return Promise.resolve();
    },
  );
  const writePort = {
    recordWatering: jest.fn().mockResolvedValue(undefined),
    adjustInventory: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<IHaWritePort>;
  const configService = {
    getOrThrow: jest.fn().mockReturnValue(config),
  } as unknown as ConfigService;
  const spaceContext = {
    run: jest.fn((_spaceId: string, fn: () => unknown) => fn()),
  } as unknown as SpaceContext;

  const router = new HaCommandRouter(
    configService,
    { subscribe } as unknown as MqttService,
    spaceContext,
    writePort,
  );

  return {
    router,
    writePort,
    subscribe,
    emit: async (topic, payload) => {
      handler?.(topic, Buffer.from(payload));
      // Let the fire-and-forget handler settle.
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

describe('HaCommandRouter', () => {
  it('subscribes to the command filter on init', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    expect(h.subscribe).toHaveBeenCalledWith(
      'gardenia/+/+/+/+/set',
      expect.any(Function),
    );
  });

  it('does not subscribe when no spaces are bridged', async () => {
    const h = buildHarness(buildConfig({ bridgedSpaceIds: [] }));
    await h.router.onModuleInit();
    expect(h.subscribe).not.toHaveBeenCalled();
  });

  it('records a watering on a plant water command', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/plant/p1/water/set', 'PRESS');
    expect(h.writePort.recordWatering).toHaveBeenCalledWith('s1', 'p1');
  });

  it('adjusts inventory by the published delta', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/inventory/i1/adjust/set', '-2');
    expect(h.writePort.adjustInventory).toHaveBeenCalledWith('s1', 'i1', -2);
  });

  it('ignores commands for a non-bridged space', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/other/plant/p1/water/set', 'PRESS');
    expect(h.writePort.recordWatering).not.toHaveBeenCalled();
  });

  it('ignores an inventory adjust with a non-numeric payload', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/inventory/i1/adjust/set', 'NaN-ish');
    expect(h.writePort.adjustInventory).not.toHaveBeenCalled();
  });

  it('ignores unknown actions', async () => {
    const h = buildHarness();
    await h.router.onModuleInit();
    await h.emit('gardenia/s1/plant/p1/explode/set', 'PRESS');
    expect(h.writePort.recordWatering).not.toHaveBeenCalled();
    expect(h.writePort.adjustInventory).not.toHaveBeenCalled();
  });
});
