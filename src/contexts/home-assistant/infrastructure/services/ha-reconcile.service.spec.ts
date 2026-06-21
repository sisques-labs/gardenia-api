import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { IInventoryStatePort } from '@contexts/home-assistant/application/ports/inventory-state.port';
import { IPlantStatePort } from '@contexts/home-assistant/application/ports/plant-state.port';
import { ISpaceSummaryPort } from '@contexts/home-assistant/application/ports/space-summary.port';
import { IWeatherStatePort } from '@contexts/home-assistant/application/ports/weather-state.port';
import { SpaceHaSummary } from '@contexts/home-assistant/domain/interfaces/space-ha-summary.interface';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { HaReconcileService } from './ha-reconcile.service';

const EMPTY_SUMMARY: SpaceHaSummary = {
  plantCount: 0,
  harvestCount: 0,
  lastHarvestAt: null,
  inventoryItemCount: 0,
  lowStockCount: 0,
};

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
  summaryPort: jest.Mocked<ISpaceSummaryPort>,
  weatherPort: jest.Mocked<IWeatherStatePort>,
  inventoryPort: jest.Mocked<IInventoryStatePort>,
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
    summaryPort,
    weatherPort,
    inventoryPort,
  );
}

describe('HaReconcileService', () => {
  let port: jest.Mocked<IPlantStatePort>;
  let summaryPort: jest.Mocked<ISpaceSummaryPort>;
  let weatherPort: jest.Mocked<IWeatherStatePort>;
  let inventoryPort: jest.Mocked<IInventoryStatePort>;
  let mqtt: { publish: jest.Mock };

  beforeEach(() => {
    port = { listPlantStates: jest.fn() } as jest.Mocked<IPlantStatePort>;
    summaryPort = {
      getSummary: jest.fn().mockResolvedValue(EMPTY_SUMMARY),
    } as jest.Mocked<ISpaceSummaryPort>;
    weatherPort = {
      getWeather: jest.fn().mockResolvedValue(null),
    } as jest.Mocked<IWeatherStatePort>;
    inventoryPort = {
      listInventory: jest.fn().mockResolvedValue([]),
    } as jest.Mocked<IInventoryStatePort>;
    mqtt = { publish: jest.fn().mockResolvedValue(undefined) };
  });

  it('publishes availability, summary, weather and plant entities', async () => {
    port.listPlantStates.mockResolvedValue([
      { plantId: 'p1', name: 'Fern', lastWateredAt: null },
    ]);
    summaryPort.getSummary.mockResolvedValue({
      plantCount: 3,
      harvestCount: 2,
      lastHarvestAt: null,
      inventoryItemCount: 5,
      lowStockCount: 1,
    });
    weatherPort.getWeather.mockResolvedValue({
      temperatureMin: 8,
      temperatureMax: 21,
      precipitation: 0,
    });
    const service = buildService(
      buildConfig(),
      port,
      summaryPort,
      weatherPort,
      inventoryPort,
      mqtt,
    );

    await service.reconcile();

    expect(summaryPort.getSummary).toHaveBeenCalledWith('s1');
    expect(weatherPort.getWeather).toHaveBeenCalledWith('s1');
    expect(port.listPlantStates).toHaveBeenCalledWith('s1');

    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/bridge/availability',
      'online',
      { retain: true },
    );
    // Summary hub sensor
    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/summary/plants_total/state',
      '3',
      { retain: true },
    );
    // Weather sensor
    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/weather/temperature_max/state',
      '21',
      { retain: true },
    );
    // Per-plant sensor
    expect(mqtt.publish).toHaveBeenCalledWith(
      'gardenia/s1/plant/p1/last_watered/state',
      'None',
      { retain: true },
    );
  });

  it('omits weather sensors when the space has no geolocation', async () => {
    port.listPlantStates.mockResolvedValue([]);
    weatherPort.getWeather.mockResolvedValue(null);
    const service = buildService(
      buildConfig(),
      port,
      summaryPort,
      weatherPort,
      inventoryPort,
      mqtt,
    );

    await service.reconcile();

    const weatherPublished = mqtt.publish.mock.calls.some(([topic]) =>
      String(topic).includes('/weather/'),
    );
    expect(weatherPublished).toBe(false);
  });

  it('does not start the loop when no spaces are bridged', () => {
    const service = buildService(
      buildConfig({ bridgedSpaceIds: [] }),
      port,
      summaryPort,
      weatherPort,
      inventoryPort,
      mqtt,
    );
    service.onModuleInit();
    expect(port.listPlantStates).not.toHaveBeenCalled();
  });
});
