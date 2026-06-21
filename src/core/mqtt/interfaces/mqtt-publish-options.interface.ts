/** Options accepted when publishing to the broker. */
export interface MqttPublishOptions {
  /**
   * Retain the message on the broker so late subscribers (Home Assistant
   * after a restart) immediately receive the last value. Discovery and state
   * topics are published retained; transient command acks are not.
   */
  retain?: boolean;
  /** MQTT QoS level (defaults to 0). */
  qos?: 0 | 1 | 2;
}
