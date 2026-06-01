import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
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

    it('returns exactly the keys [status, timestamp]', () => {
      const result = controller.check();
      expect(Object.keys(result).sort()).toEqual(['status', 'timestamp']);
    });
  });
});
