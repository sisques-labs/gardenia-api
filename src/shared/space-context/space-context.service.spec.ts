import { SpaceContextMissingException } from '@contexts/spaces/domain/exceptions/space-context-missing.exception';
import { SpaceContext } from './space-context.service';

const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('SpaceContext', () => {
  let service: SpaceContext;

  beforeEach(() => {
    service = new SpaceContext();
  });

  describe('get()', () => {
    it('should return undefined when called outside of run()', () => {
      const result = service.get();

      expect(result).toBeUndefined();
    });

    it('should return the spaceId when called inside run()', () => {
      let result: string | undefined;

      service.run(SPACE_ID, () => {
        result = service.get();
      });

      expect(result).toBe(SPACE_ID);
    });
  });

  describe('require()', () => {
    it('should throw SpaceContextMissingException when store is empty', () => {
      expect(() => service.require()).toThrow(SpaceContextMissingException);
    });

    it('should return the spaceId when store is set', () => {
      let result: string | undefined;

      service.run(SPACE_ID, () => {
        result = service.require();
      });

      expect(result).toBe(SPACE_ID);
    });
  });

  describe('run()', () => {
    it('should provide isolation between two concurrent executions', async () => {
      const SPACE_A = '550e8400-e29b-41d4-a716-000000000001';
      const SPACE_B = '550e8400-e29b-41d4-a716-000000000002';

      const results: Array<string | undefined> = [];

      // Simulate two overlapping async contexts
      const pA = new Promise<void>((resolve) => {
        service.run(SPACE_A, () => {
          setTimeout(() => {
            results.push(service.get());
            resolve();
          }, 10);
        });
      });

      const pB = new Promise<void>((resolve) => {
        service.run(SPACE_B, () => {
          setTimeout(() => {
            results.push(service.get());
            resolve();
          }, 5);
        });
      });

      await Promise.all([pA, pB]);

      expect(results).toContain(SPACE_A);
      expect(results).toContain(SPACE_B);
    });

    it('should return the result of the callback', () => {
      const result = service.run(SPACE_ID, () => 42);

      expect(result).toBe(42);
    });

    it('should not expose the spaceId outside the run callback', () => {
      service.run(SPACE_ID, () => {
        // inside run
      });

      expect(service.get()).toBeUndefined();
    });
  });
});
