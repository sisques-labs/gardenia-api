/**
 * Literal `gardenia-bridge`-owned topic names — NOT derived from this app's
 * own `KAFKA_TOPIC_PREFIX` (that prefix only applies to gardenia-api's own
 * domain-event forwarding, `${topicPrefix}.${module}`). These are a
 * different producer's namespace entirely.
 */
export const NODES_KAFKA_TOPICS = {
  TELEMETRY: 'gardenia-bridge.telemetry',
  HEARTBEAT: 'gardenia-bridge.heartbeat',
  COMMAND_ACKS: 'gardenia-bridge.command-acks',
  COMMANDS: 'gardenia-bridge.commands',
} as const;
