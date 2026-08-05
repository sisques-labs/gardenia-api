import { CorrelationContext } from './correlation-context.service';

const CORRELATION_ID = '11111111-2222-3333-4444-555555555555';

describe('CorrelationContext', () => {
  let service: CorrelationContext;

  beforeEach(() => {
    service = new CorrelationContext();
  });

  describe('get()', () => {
    it('should return undefined when called outside of run()', () => {
      const result = service.get();

      expect(result).toBeUndefined();
    });

    it('should return the correlationId when called inside run()', () => {
      let result: string | undefined;

      service.run(CORRELATION_ID, () => {
        result = service.get();
      });

      expect(result).toBe(CORRELATION_ID);
    });
  });

  describe('run()', () => {
    it('should provide isolation between two concurrent executions', async () => {
      const ID_A = '11111111-0000-0000-0000-000000000001';
      const ID_B = '11111111-0000-0000-0000-000000000002';

      const results: Array<string | undefined> = [];

      const pA = new Promise<void>((resolve) => {
        service.run(ID_A, () => {
          setTimeout(() => {
            results.push(service.get());
            resolve();
          }, 10);
        });
      });

      const pB = new Promise<void>((resolve) => {
        service.run(ID_B, () => {
          setTimeout(() => {
            results.push(service.get());
            resolve();
          }, 5);
        });
      });

      await Promise.all([pA, pB]);

      expect(results).toContain(ID_A);
      expect(results).toContain(ID_B);
    });

    it('should return the result of the callback', () => {
      const result = service.run(CORRELATION_ID, () => 42);

      expect(result).toBe(42);
    });

    it('should not expose the correlationId outside the run callback', () => {
      service.run(CORRELATION_ID, () => {
        // inside run
      });

      expect(service.get()).toBeUndefined();
    });
  });
});
