import { MqttService } from '@core/mqtt/services/mqtt.service';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let mqttService: jest.Mocked<Pick<MqttService, 'enabled' | 'connected'>>;

  beforeEach(() => {
    mqttService = { enabled: false, connected: false } as jest.Mocked<
      Pick<MqttService, 'enabled' | 'connected'>
    >;
    controller = new HealthController(mqttService as unknown as MqttService);
  });

  describe('check()', () => {
    it('returns status "ok"', () => {
      const result = controller.check();
      expect(result.status).toBe('ok');
    });

    it('returns a valid ISO 8601 timestamp', () => {
      const result = controller.check();
      expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
    });

    it('returns exactly the keys [status, timestamp, mqtt]', () => {
      const result = controller.check();
      expect(Object.keys(result).sort()).toEqual([
        'mqtt',
        'status',
        'timestamp',
      ]);
    });

    it('reports mqtt "disabled" when the transport is off', () => {
      const result = controller.check();
      expect(result.mqtt).toBe('disabled');
    });

    it('reports mqtt "up" when enabled and connected', () => {
      Object.assign(mqttService, { enabled: true, connected: true });
      expect(controller.check().mqtt).toBe('up');
    });

    it('reports mqtt "down" when enabled but not connected', () => {
      Object.assign(mqttService, { enabled: true, connected: false });
      expect(controller.check().mqtt).toBe('down');
    });
  });
});
