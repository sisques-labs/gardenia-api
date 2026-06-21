import { registerAs } from '@nestjs/config';

/**
 * Resolved MQTT transport configuration.
 *
 * The transport is **disabled by default**: with `MQTT_ENABLED` unset (or not
 * `'true'`) the application connects to no broker and publishes nothing, so
 * behaviour is identical to having no Home Assistant integration at all.
 */
export interface MqttConfig {
  /** Whether the broker connection is established at all. */
  enabled: boolean;
  /** Broker URL, e.g. `mqtt://homeassistant.local:1883`. */
  url?: string;
  /** Broker username (broker-level service account). */
  username?: string;
  /** Broker password. */
  password?: string;
  /** Root topic segment for all Gardenia state/command topics. */
  baseTopic: string;
  /** Home Assistant MQTT Discovery prefix (HA default: `homeassistant`). */
  discoveryPrefix: string;
  /** How often (ms) the bridge re-publishes a full state snapshot. */
  reconcileIntervalMs: number;
}

const DEFAULT_BASE_TOPIC = 'gardenia';
const DEFAULT_DISCOVERY_PREFIX = 'homeassistant';
const DEFAULT_RECONCILE_INTERVAL_MS = 5 * 60 * 1000;

function parseInterval(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid HA_RECONCILE_INTERVAL "${value}": expected a positive number of milliseconds`,
    );
  }

  return parsed;
}

export const mqttConfig = registerAs('mqtt', (): MqttConfig => {
  const enabled = process.env.MQTT_ENABLED?.trim().toLowerCase() === 'true';

  return {
    enabled,
    url: process.env.MQTT_URL?.trim() || undefined,
    username: process.env.MQTT_USERNAME?.trim() || undefined,
    password: process.env.MQTT_PASSWORD ?? undefined,
    baseTopic: process.env.MQTT_BASE_TOPIC?.trim() || DEFAULT_BASE_TOPIC,
    discoveryPrefix:
      process.env.HA_DISCOVERY_PREFIX?.trim() || DEFAULT_DISCOVERY_PREFIX,
    reconcileIntervalMs: parseInterval(
      process.env.HA_RECONCILE_INTERVAL,
      DEFAULT_RECONCILE_INTERVAL_MS,
    ),
  };
});
