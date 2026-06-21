/**
 * A single Home Assistant entity to publish: its retained discovery config and
 * the retained state value. The reconcile service publishes both topics.
 */
export interface HaDiscoveryMessage {
  configTopic: string;
  config: Record<string, unknown>;
  stateTopic: string;
  state: string;
}
