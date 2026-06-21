/**
 * Builds every MQTT topic the bridge uses, from the configured base topic and
 * Home Assistant discovery prefix. Tenancy isolation lives here: state and
 * command topics are always namespaced by space (`{base}/{spaceId}/…`), so the
 * bridge can never publish to or accept a command from another space.
 *
 * Pure (no Nest/config dependency) so the domain stays framework-free; the
 * infrastructure layer constructs it from `MqttConfig`.
 */
export class HaTopicFactory {
  constructor(
    private readonly baseTopic: string,
    private readonly discoveryPrefix: string,
  ) {
    if (!baseTopic.trim())
      throw new Error('HaTopicFactory: baseTopic required');
    if (!discoveryPrefix.trim()) {
      throw new Error('HaTopicFactory: discoveryPrefix required');
    }
  }

  /** Retained per-space availability topic (referenced by every entity). */
  availability(spaceId: string): string {
    return `${this.baseTopic}/${this.requireSpace(spaceId)}/bridge/availability`;
  }

  /** State topic, e.g. `gardenia/<space>/plant/<id>/last_watered/state`. */
  state(spaceId: string, ...segments: string[]): string {
    return `${this.prefix(spaceId, segments)}/state`;
  }

  /** Command topic, e.g. `gardenia/<space>/plant/<id>/water/set`. */
  command(spaceId: string, ...segments: string[]): string {
    return `${this.prefix(spaceId, segments)}/set`;
  }

  /** Discovery config topic: `<discoveryPrefix>/<component>/<node>/<object>/config`. */
  discoveryConfig(component: string, node: string, objectId: string): string {
    return `${this.discoveryPrefix}/${component}/${node}/${objectId}/config`;
  }

  /** Stable node id grouping all of a space's entities under one HA hub. */
  node(spaceId: string): string {
    return `gardenia_${this.requireSpace(spaceId)}`;
  }

  private prefix(spaceId: string, segments: string[]): string {
    return `${this.baseTopic}/${this.requireSpace(spaceId)}/${segments.join('/')}`;
  }

  private requireSpace(spaceId: string): string {
    if (!spaceId || !spaceId.trim()) {
      throw new Error('HaTopicFactory: spaceId required');
    }
    return spaceId;
  }
}
