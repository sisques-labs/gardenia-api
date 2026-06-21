/**
 * Handler invoked for every message whose topic matches a subscription filter.
 * `payload` is the raw broker buffer; callers decode it as they see fit.
 */
export type MqttMessageHandler = (topic: string, payload: Buffer) => void;
