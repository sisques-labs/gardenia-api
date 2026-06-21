/**
 * A single Home Assistant entity to publish: its retained discovery config and,
 * for stateful entities, the retained state value. Command-only entities
 * (buttons) omit `stateTopic`/`state`.
 */
export interface HaDiscoveryMessage {
  configTopic: string;
  config: Record<string, unknown>;
  stateTopic?: string;
  state?: string;
}
