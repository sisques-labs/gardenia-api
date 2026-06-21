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

export interface HaButtonSpec {
  objectId: string;
  name: string;
  /** Segments after the space prefix for the command topic. */
  commandSegments: string[];
  device: HaSensorDevice;
}

export interface HaNumberSpec {
  objectId: string;
  name: string;
  /** Command topic segments (HA publishes the chosen value here). */
  commandSegments: string[];
  /** State topic segments (the control's resting value). */
  stateSegments: string[];
  state: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  device: HaSensorDevice;
}

/**
 * Builds single Home Assistant discovery messages (config + optional state)
 * with a stable `unique_id`. Shared by every entity mapper so the discovery
 * shape stays consistent across sensors, buttons and numbers.
 */
export class HaSensorBuilder {
  build(
    topics: HaTopicFactory,
    spaceId: string,
    spec: HaSensorSpec,
  ): HaDiscoveryMessage {
    const stateTopic = topics.state(spaceId, ...spec.stateSegments);
    const config = this.base(
      topics,
      spaceId,
      spec.objectId,
      spec.name,
      spec.device,
    );
    config.state_topic = stateTopic;
    if (spec.deviceClass) config.device_class = spec.deviceClass;
    if (spec.unit) config.unit_of_measurement = spec.unit;

    return {
      configTopic: this.configTopic(topics, spaceId, 'sensor', spec.objectId),
      config,
      stateTopic,
      state: spec.state,
    };
  }

  /** A stateless HA `button` that publishes `PRESS` to its command topic. */
  button(
    topics: HaTopicFactory,
    spaceId: string,
    spec: HaButtonSpec,
  ): HaDiscoveryMessage {
    const config = this.base(
      topics,
      spaceId,
      spec.objectId,
      spec.name,
      spec.device,
    );
    config.command_topic = topics.command(spaceId, ...spec.commandSegments);
    config.payload_press = 'PRESS';

    return {
      configTopic: this.configTopic(topics, spaceId, 'button', spec.objectId),
      config,
    };
  }

  /** An HA `number` whose published value is the delta/value to apply. */
  number(
    topics: HaTopicFactory,
    spaceId: string,
    spec: HaNumberSpec,
  ): HaDiscoveryMessage {
    const stateTopic = topics.state(spaceId, ...spec.stateSegments);
    const config = this.base(
      topics,
      spaceId,
      spec.objectId,
      spec.name,
      spec.device,
    );
    config.command_topic = topics.command(spaceId, ...spec.commandSegments);
    config.state_topic = stateTopic;
    config.min = spec.min;
    config.max = spec.max;
    config.step = spec.step;
    config.mode = 'box';
    if (spec.unit) config.unit_of_measurement = spec.unit;

    return {
      configTopic: this.configTopic(topics, spaceId, 'number', spec.objectId),
      config,
      stateTopic,
      state: spec.state,
    };
  }

  private base(
    topics: HaTopicFactory,
    spaceId: string,
    objectId: string,
    name: string,
    device: HaSensorDevice,
  ): Record<string, unknown> {
    const uniqueId = `${topics.node(spaceId)}_${objectId}`;
    return {
      name,
      unique_id: uniqueId,
      object_id: uniqueId,
      availability_topic: topics.availability(spaceId),
      device,
    };
  }

  private configTopic(
    topics: HaTopicFactory,
    spaceId: string,
    component: string,
    objectId: string,
  ): string {
    return topics.discoveryConfig(component, topics.node(spaceId), objectId);
  }
}
