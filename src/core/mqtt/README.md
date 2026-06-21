# MQTT (Home Assistant transport)

Owns the single managed connection to an MQTT broker. It is the shared wire that
the `home-assistant` bridge context uses to publish Home Assistant **Discovery**
and **state** topics and to receive **command** / **sensor** messages back.

## At a glance

- **Client**: official `mqtt` package (`connect` → `MqttClient`).
- **Connection**: one long-lived, auto-reconnecting connection per process.
- **Disabled by default**: with `MQTT_ENABLED` unset (or not `"true"`) the service
  connects to nothing and every method is a no-op — the rest of the app is
  unaffected.
- **Availability (LWT)**: connects with a retained Last-Will on
  `{MQTT_BASE_TOPIC}/bridge/availability` (`offline`), and publishes `online`
  (retained) on connect. Per-space availability is layered on top by the bridge.
- **No tenancy here**: this module owns the wire only. Callers build
  space-scoped topics (`{base}/{spaceId}/...`); isolation is the bridge's job.

## Configuration

Loaded by `mqtt.config.ts` as `registerAs('mqtt')`:

| Env var | Default | Purpose |
|---------|---------|---------|
| `MQTT_ENABLED` | `false` | Master switch. Anything but `"true"` disables the transport. |
| `MQTT_URL` | — | Broker URL, e.g. `mqtt://homeassistant.local:1883`. |
| `MQTT_USERNAME` / `MQTT_PASSWORD` | — | Broker service-account credentials. |
| `MQTT_BASE_TOPIC` | `gardenia` | Root segment for all state/command topics. |
| `HA_DISCOVERY_PREFIX` | `homeassistant` | Home Assistant MQTT Discovery prefix. |
| `HA_RECONCILE_INTERVAL` | `300000` | State-snapshot interval (ms) used by the bridge. |

## Building blocks

| File | Responsibility |
|------|----------------|
| `services/mqtt.service.ts` | Connection lifecycle, `publish` / `subscribe`, routing, LWT |
| `utils/topic-matcher.ts` | MQTT `+` / `#` wildcard matching for handler routing |
| `interfaces/mqtt-message-handler.type.ts` | Subscription handler signature |
| `interfaces/mqtt-publish-options.interface.ts` | `retain` / `qos` publish options |
| `mqtt.module.ts` | Global module exporting `MqttService` |

## Usage

`MqttModule` is `@Global`, so inject `MqttService` anywhere:

```ts
constructor(private readonly mqtt: MqttService) {}

await this.mqtt.publish('gardenia/<spaceId>/plant/<plantId>/state', payload, {
  retain: true,
});

await this.mqtt.subscribe('gardenia/<spaceId>/plant/+/set', (topic, payload) => {
  // route to a CommandBus dispatch (in the home-assistant bridge)
});
```

`publish` JSON-serializes objects (strings/buffers pass through). When the broker
is not connected, `publish` is a debug-logged no-op and `subscribe` queues the
filter to be applied on the next connect.

## Health

The `/health` endpoint reports `mqtt: "disabled" | "up" | "down"` derived from
`MqttService.enabled` / `MqttService.connected`.
