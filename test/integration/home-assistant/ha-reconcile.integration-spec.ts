import { randomUUID } from 'crypto';

import { ConfigService } from '@nestjs/config';

import { MqttConfig } from '@core/config/mqtt.config';
import { MqttService } from '@core/mqtt/services/mqtt.service';
import { CareLogModule } from '@contexts/care-log/care-log.module';
import { HarvestsModule } from '@contexts/harvests/harvests.module';
import {
  INVENTORY_STATE_PORT,
  IInventoryStatePort,
} from '@contexts/home-assistant/application/ports/inventory-state.port';
import {
  PLANT_STATE_PORT,
  IPlantStatePort,
} from '@contexts/home-assistant/application/ports/plant-state.port';
import {
  SPACE_SUMMARY_PORT,
  ISpaceSummaryPort,
} from '@contexts/home-assistant/application/ports/space-summary.port';
import {
  WEATHER_STATE_PORT,
  IWeatherStatePort,
} from '@contexts/home-assistant/application/ports/weather-state.port';
import { InventoryStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/inventory-state.adapter';
import { PlantStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/plant-state.adapter';
import { SpaceSummaryAdapter } from '@contexts/home-assistant/infrastructure/adapters/space-summary.adapter';
import { WeatherStateAdapter } from '@contexts/home-assistant/infrastructure/adapters/weather-state.adapter';
import { HaReconcileService } from '@contexts/home-assistant/infrastructure/services/ha-reconcile.service';
import { InventoryModule } from '@contexts/inventory/inventory.module';
import { PlantsModule } from '@contexts/plants/plants.module';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { WeatherModule } from '@contexts/weather/weather.module';

import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const WATERED_AT = new Date('2026-06-10T09:00:00.000Z');

interface PublishCall {
  topic: string;
  payload: unknown;
}

function fakeMqtt(calls: PublishCall[]): MqttService {
  return {
    publish: jest.fn((topic: string, payload: unknown) => {
      calls.push({ topic, payload });
      return Promise.resolve();
    }),
  } as unknown as MqttService;
}

function fakeConfig(spaceId: string): ConfigService {
  const config: MqttConfig = {
    enabled: true,
    baseTopic: 'gardenia',
    discoveryPrefix: 'homeassistant',
    reconcileIntervalMs: 60_000,
    bridgedSpaceIds: [spaceId],
  };
  return {
    getOrThrow: jest.fn().mockReturnValue(config),
  } as unknown as ConfigService;
}

describe('HA bridge reconcile (integration)', () => {
  let ctx: IntegrationContext;
  let service: HaReconcileService;
  const calls: PublishCall[] = [];

  const spaceId = randomUUID();
  const userId = randomUUID();
  const plantId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({
      imports: [
        PlantsModule,
        CareLogModule,
        HarvestsModule,
        InventoryModule,
        SpacesModule,
        WeatherModule,
      ],
      providers: [
        { provide: PLANT_STATE_PORT, useClass: PlantStateAdapter },
        { provide: SPACE_SUMMARY_PORT, useClass: SpaceSummaryAdapter },
        { provide: WEATHER_STATE_PORT, useClass: WeatherStateAdapter },
        { provide: INVENTORY_STATE_PORT, useClass: InventoryStateAdapter },
      ],
    });

    // Trigger onApplicationBootstrap so the CQRS explorer registers the
    // query handlers the bridge adapters dispatch to.
    await ctx.module.init();

    service = new HaReconcileService(
      fakeConfig(spaceId),
      fakeMqtt(calls),
      ctx.spaceContext,
      ctx.module.get<IPlantStatePort>(PLANT_STATE_PORT),
      ctx.module.get<ISpaceSummaryPort>(SPACE_SUMMARY_PORT),
      ctx.module.get<IWeatherStatePort>(WEATHER_STATE_PORT),
      ctx.module.get<IInventoryStatePort>(INVENTORY_STATE_PORT),
    );
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    calls.length = 0;
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceId, userId, {
      spaceName: 'Home',
      username: 'owner',
    });
    await ctx.dataSource.query(
      `INSERT INTO "plants" ("id", "name", "user_id", "space_id", "created_at", "updated_at")
       VALUES ($1, $2, $3, $4, now(), now())`,
      [plantId, 'Fern', userId, spaceId],
    );
    await ctx.dataSource.query(
      `INSERT INTO "care_log_entries" ("id", "plant_id", "user_id", "space_id", "activity_type", "performed_at")
       VALUES ($1, $2, $3, $4, 'WATERING', $5)`,
      [randomUUID(), plantId, userId, spaceId, WATERED_AT],
    );
  });

  it('publishes availability, plant last_watered and summary counts for a seeded space', async () => {
    await service.reconcile();

    const byTopic = new Map(calls.map((c) => [c.topic, c.payload]));

    expect(byTopic.get('gardenia/' + spaceId + '/bridge/availability')).toBe(
      'online',
    );
    expect(
      byTopic.get(`gardenia/${spaceId}/plant/${plantId}/last_watered/state`),
    ).toBe(WATERED_AT.toISOString());
    expect(byTopic.get(`gardenia/${spaceId}/summary/plants_total/state`)).toBe(
      '1',
    );

    // No geolocation seeded → no weather sensors published.
    const weatherPublished = calls.some((c) => c.topic.includes('/weather/'));
    expect(weatherPublished).toBe(false);
  });
});
