import { TaskHandlerKeyValueObject } from './task-handler-key.value-object';

describe('TaskHandlerKeyValueObject', () => {
  describe('fromNullable', () => {
    it('returns null when value is null', () => {
      expect(TaskHandlerKeyValueObject.fromNullable(null)).toBeNull();
    });

    it('returns a TaskHandlerKeyValueObject when value is a valid string', () => {
      const vo = TaskHandlerKeyValueObject.fromNullable('water-plant');
      expect(vo).toBeInstanceOf(TaskHandlerKeyValueObject);
      expect(vo?.value).toBe('water-plant');
    });

    it('throws when value is an invalid string', () => {
      expect(() =>
        TaskHandlerKeyValueObject.fromNullable('INVALID KEY'),
      ).toThrow();
    });
  });
});
