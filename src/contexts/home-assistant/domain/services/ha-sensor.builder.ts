import { HaDiscoveryMessage } from '@contexts/home-assistant/domain/interfaces/ha-discovery-message.interface';
import { HaTopicFactory } from '@contexts/home-assistant/domain/services/ha-topic.factory';

export interface HaSensorDevice {
  identifiers: string[];
  name: string;
  manufacturer?: string;
  model?: string;
  via_device?: string;
}

export interface HaSensorSpec {
  /** Stable object id within the space node (also the unique_id suffix). */
  objectId: string;
  /** Friendly entity name shown in Home Assistant. */
  name: string;
  /** Segments after the space prefix for the state topic. */
  stateSegments: string[];
  /** Retained state value. */
  state: string;
  /** HA `device_class` (e.g. `timestamp`, `temperature`). */
  deviceClass?: string;
  /** HA `unit_of_measurement` (e.g. `°C`, `mm`). */
  unit?: string;
  /** The HA device this sensor belongs to. */
  device: HaSensorDevice;
}

/**
 * Builds a single Home Assistant `sensor` discovery message (config + state)
 * with a stable `unique_id`. Shared by every entity mapper so the discovery
 * shape stays consistent.
 */
export class HaSensorBuilder {
  build(
    topics: HaTopicFactory,
    spaceId: string,
    spec: HaSensorSpec,
  ): HaDiscoveryMessage {
    const node = topics.node(spaceId);
    const uniqueId = `${node}_${spec.objectId}`;
    const stateTopic = topics.state(spaceId, ...spec.stateSegments);

    const config: Record<string, unknown> = {
      name: spec.name,
      unique_id: uniqueId,
      object_id: uniqueId,
      state_topic: stateTopic,
      availability_topic: topics.availability(spaceId),
      device: spec.device,
    };
    if (spec.deviceClass) config.device_class = spec.deviceClass;
    if (spec.unit) config.unit_of_measurement = spec.unit;

    return {
      configTopic: topics.discoveryConfig('sensor', node, spec.objectId),
      config,
      stateTopic,
      state: spec.state,
    };
  }
}
