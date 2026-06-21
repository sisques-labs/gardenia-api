import { Global, Module } from '@nestjs/common';

import { MqttService } from './services/mqtt.service';

/**
 * Wires the shared MQTT transport (a single managed broker connection).
 *
 * Global so any bounded context — notably the `home-assistant` bridge — can
 * inject {@link MqttService} without importing this module. When the transport
 * is disabled the service connects to nothing, so importing this module is
 * always safe.
 */
@Global()
@Module({
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}
