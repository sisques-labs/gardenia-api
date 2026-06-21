import { randomUUID } from 'crypto';
import * as net from 'net';

import * as mqtt from 'mqtt';

import { MqttService } from '@core/mqtt/services/mqtt.service';
import { HaReconcileService } from '@contexts/home-assistant/infrastructure/services/ha-reconcile.service';

// aedes (CJS build) is required to avoid type-resolution friction under
// ts-jest's commonjs output.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const aedesFactory = require('aedes') as () => {
  handle: (socket: net.Socket) => void;
  close: (cb: () => void) => void;
};

const SPACE_ID = randomUUID();
const USER_ID = randomUUID();
const PLANT_ID = randomUUID();
const BASE = 'gardenia';

// Env must be set before the app (and its mqtt config) is created.
let broker: {
  handle: (socket: net.Socket) => void;
  close: (cb: () => void) => void;
};
let server: net.Server;

async function startBroker(): Promise<number> {
  broker = aedesFactory();
  server = net.createServer((socket) => broker.handle(socket));
  await new Promise<void>((resolve) => server.listen(0, resolve));
  return (server.address() as net.AddressInfo).port;
}

function waitFor<T>(
  fn: () => Promise<T | null | undefined>,
  { timeout = 5000, interval = 100 } = {},
): Promise<T> {
  const start = Date.now();
  return new Promise<T>((resolve, reject) => {
    const tick = async () => {
      try {
        const result = await fn();
        if (result) return resolve(result);
      } catch (error) {
        return reject(error);
      }
      if (Date.now() - start > timeout) {
        return reject(new Error('waitFor timed out'));
      }
      setTimeout(() => void tick(), interval);
    };
    void tick();
  });
}

// Imported lazily so env is set first.
type E2EContext = import('../../helpers/app-bootstrap').E2EContext;
let createE2EApp: (typeof import('../../helpers/app-bootstrap'))['createE2EApp'];

describe('HA bridge over MQTT (e2e)', () => {
  let ctx: E2EContext;
  let client: mqtt.MqttClient;

  beforeAll(async () => {
    const port = await startBroker();
    process.env.MQTT_ENABLED = 'true';
    process.env.MQTT_URL = `mqtt://127.0.0.1:${port}`;
    process.env.MQTT_BASE_TOPIC = BASE;
    process.env.HA_BRIDGED_SPACES = SPACE_ID;
    process.env.HA_RECONCILE_INTERVAL = '3600000';

    ({ createE2EApp } = await import('../../helpers/app-bootstrap'));
    ctx = await createE2EApp();

    // Wait until the app's MqttService has connected to the broker.
    const mqttService = ctx.app.get(MqttService, { strict: false });
    await waitFor(async () => (mqttService.connected ? true : null));

    client = mqtt.connect(`mqtt://127.0.0.1:${port}`);
    await new Promise<void>((resolve) => client.on('connect', () => resolve()));
  }, 30000);

  afterAll(async () => {
    if (client)
      await new Promise<void>((r) => client.end(false, {}, () => r()));
    if (ctx) await ctx.close();
    if (server) await new Promise<void>((r) => server.close(() => r()));
    if (broker) await new Promise<void>((r) => broker.close(() => r()));
    delete process.env.MQTT_ENABLED;
    delete process.env.MQTT_URL;
    delete process.env.MQTT_BASE_TOPIC;
    delete process.env.HA_BRIDGED_SPACES;
    delete process.env.HA_RECONCILE_INTERVAL;
  });

  beforeEach(async () => {
    await ctx.dataSource.query(
      `TRUNCATE "spaces", "users", "space_memberships", "plants", "care_log_entries", "sensor_readings" RESTART IDENTITY CASCADE`,
    );
    await ctx.dataSource.query(
      `INSERT INTO "spaces" ("id", "name", "owner_id", "created_at", "updated_at") VALUES ($1,$2,$3,now(),now())`,
      [SPACE_ID, 'Home', USER_ID],
    );
    await ctx.dataSource.query(
      `INSERT INTO "users" ("id", "space_id", "status", "username", "createdAt", "updatedAt") VALUES ($1,$2,'ACTIVE','owner',now(),now())`,
      [USER_ID, SPACE_ID],
    );
    await ctx.dataSource.query(
      `INSERT INTO "plants" ("id", "name", "user_id", "space_id", "created_at", "updated_at") VALUES ($1,'Fern',$2,$3,now(),now())`,
      [PLANT_ID, USER_ID, SPACE_ID],
    );
  });

  it('records a watering when HA presses the plant Water button', async () => {
    client.publish(`${BASE}/${SPACE_ID}/plant/${PLANT_ID}/water/set`, 'PRESS');

    const rows = await waitFor(async () => {
      const r = (await ctx.dataSource.query(
        `SELECT activity_type FROM care_log_entries WHERE plant_id = $1`,
        [PLANT_ID],
      )) as Array<{ activity_type: string }>;
      return r.length > 0 ? r : null;
    });

    expect(rows[0].activity_type).toBe('WATERING');
  }, 15000);

  it('persists a sensor reading published by HA', async () => {
    client.publish(
      `${BASE}/${SPACE_ID}/plant/${PLANT_ID}/moisture/reading`,
      '42.5',
    );

    const rows = await waitFor(async () => {
      const r = (await ctx.dataSource.query(
        `SELECT metric, value FROM sensor_readings WHERE plant_id = $1`,
        [PLANT_ID],
      )) as Array<{ metric: string; value: string }>;
      return r.length > 0 ? r : null;
    });

    expect(rows[0].metric).toBe('moisture');
    expect(parseFloat(rows[0].value)).toBe(42.5);
  }, 15000);

  it('publishes a plant last_watered state on reconcile (HA reads)', async () => {
    await ctx.dataSource.query(
      `INSERT INTO "care_log_entries" ("id","plant_id","user_id","space_id","activity_type","performed_at") VALUES ($1,$2,$3,$4,'WATERING',$5)`,
      [
        randomUUID(),
        PLANT_ID,
        USER_ID,
        SPACE_ID,
        new Date('2026-06-10T09:00:00Z'),
      ],
    );

    const stateTopic = `${BASE}/${SPACE_ID}/plant/${PLANT_ID}/last_watered/state`;
    const received = new Promise<string>((resolve) => {
      client.on('message', (topic, payload) => {
        if (topic === stateTopic) resolve(payload.toString('utf8'));
      });
    });
    await new Promise<void>((resolve) =>
      client.subscribe(stateTopic, () => resolve()),
    );

    const reconcile = ctx.app.get(HaReconcileService, { strict: false });
    await reconcile.reconcile();

    expect(await received).toBe(new Date('2026-06-10T09:00:00Z').toISOString());
  }, 15000);
});
