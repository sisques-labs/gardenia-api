import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { IPlantStatePort } from '@contexts/home-assistant/application/ports/plant-state.port';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { HaReconcileService } from './ha-reconcile.service';

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

function buildService(
  config: MqttConfig,
  port: jest.Mocked<IPlantStatePort>,
  mqtt: { publish: jest.Mock },
): HaReconcileService {
  const configService = {
    getOrThrow: jest.fn().mockReturnValue(config),
  } as unknown as ConfigService;
  const spaceContext = {
    run: jest.fn((_spaceId: string, fn: () => unknown) => fn()),
  } as unknown as SpaceContext;
  return new HaReconcileService(
    configService,
    mqtt as unknown as MqttService,
    spaceContext,
    port,
  );
}

describe('HaReconcileService', () => {
  let port: jest.Mocked<IPlantStatePort>;
  let mqtt: { publish: jest.Mock };

  beforeEach(() => {
    port = { listPlantStates: jest.fn() } as jest.Mocked<IPlantStatePort>;
    mqtt = { publish: jest.fn().mockResolvedValue(undefined) };
  });

  it('publishes availability, discovery and state per bridged space', async () => {
    port.listPlantStates.mockResolvedValue([
      { plantId: 'p1', name: 'Fern', lastWateredAt: null },
    ]);
    const service = buildService(buildConfig(), port, mqtt);

    await service.reconcile();

    expect(port.listPlantStates).toHaveBeenCalledWith('s1');
    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/bridge/availability',
      'online',
      { retain: true },
    );
    expect(mqtt.publish).toHaveBeenCalledWith(
      'homeassistant/sensor/gardenia_s1/plant_p1_last_watered/config',
      expect.objectContaining({ device_class: 'timestamp' }),
      { retain: true },
    );
    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/plant/p1/last_watered/state',
      'None',
      { retain: true },
    );
  });

  it('does not start the loop when no spaces are bridged', () => {
    const service = buildService(
      buildConfig({ bridgedSpaceIds: [] }),
      port,
      mqtt,
    );
    service.onModuleInit();
    expect(port.listPlantStates).not.toHaveBeenCalled();
  });
});
