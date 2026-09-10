import { ExternalSubjectValueObject } from './external-subject.vo';

describe('ExternalSubjectValueObject', () => {
  it('should expose the value for a valid platform subject', () => {
    const vo = new ExternalSubjectValueObject('platform-subject-123');

    expect(vo.value).toBe('platform-subject-123');
  });

  it('should throw when the value is empty', () => {
    expect(() => new ExternalSubjectValueObject('')).toThrow();
  });

  it('should throw when the value is only whitespace', () => {
    expect(() => new ExternalSubjectValueObject('   ')).toThrow();
  });
});
