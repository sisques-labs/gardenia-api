import { CareLogNotesValueObject } from './care-log-notes.value-object';

describe('CareLogNotesValueObject', () => {
  it('should not throw for valid notes', () => {
    expect(() => new CareLogNotesValueObject('Watered the plant')).not.toThrow();
  });

  it('should throw for an empty string', () => {
    expect(() => new CareLogNotesValueObject('')).toThrow();
  });

  it('should throw for a string exceeding 2000 characters', () => {
    const tooLong = 'a'.repeat(2001);
    expect(() => new CareLogNotesValueObject(tooLong)).toThrow();
  });

  it('should not throw for exactly 2000 characters', () => {
    const maxLength = 'a'.repeat(2000);
    expect(() => new CareLogNotesValueObject(maxLength)).not.toThrow();
  });
});
