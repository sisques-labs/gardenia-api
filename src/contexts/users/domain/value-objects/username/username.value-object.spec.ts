import { FieldIsRequiredException } from '@sisques-labs/nestjs-kit';

import { InvalidUsernameFormatException } from '@contexts/users/domain/exceptions/invalid-username-format.exception';
import { InvalidUsernameLengthException } from '@contexts/users/domain/exceptions/invalid-username-length.exception';
import { UsernameValueObject } from './username.value-object';

describe('UsernameValueObject', () => {
  describe('valid inputs', () => {
    it('should create a VO with a valid lowercase username', () => {
      const vo = new UsernameValueObject('johndoe');

      expect(vo.value).toBe('johndoe');
    });

    it('should create a VO with digits and underscores', () => {
      const vo = new UsernameValueObject('user_42');

      expect(vo.value).toBe('user_42');
    });

    it('should create a VO with exactly MIN_LENGTH (3) chars', () => {
      const vo = new UsernameValueObject('abc');

      expect(vo.value).toBe('abc');
    });

    it('should create a VO with exactly MAX_LENGTH (30) chars', () => {
      const thirty = 'a'.repeat(30);
      const vo = new UsernameValueObject(thirty);

      expect(vo.value).toBe(thirty);
    });
  });

  describe('lowercase normalization', () => {
    it('should normalize uppercase letters to lowercase', () => {
      const vo = new UsernameValueObject('JohnDoe');

      expect(vo.value).toBe('johndoe');
    });

    it('should normalize mixed-case to lowercase', () => {
      const vo = new UsernameValueObject('JOHN_123');

      expect(vo.value).toBe('john_123');
    });
  });

  describe('equals()', () => {
    it('should return true for two VOs with the same value', () => {
      const a = new UsernameValueObject('johndoe');
      const b = new UsernameValueObject('johndoe');

      expect(a.equals(b)).toBe(true);
    });

    it('should return false for two VOs with different values', () => {
      const a = new UsernameValueObject('johndoe');
      const b = new UsernameValueObject('janedoe');

      expect(a.equals(b)).toBe(false);
    });

    it('should return true when one VO is constructed with uppercase (normalized to same value)', () => {
      const a = new UsernameValueObject('JohnDoe');
      const b = new UsernameValueObject('johndoe');

      expect(a.equals(b)).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('should throw FieldIsRequiredException for empty string', () => {
      expect(() => new UsernameValueObject('')).toThrow(FieldIsRequiredException);
    });

    it('should throw InvalidUsernameLengthException for username shorter than 3 chars', () => {
      expect(() => new UsernameValueObject('ab')).toThrow(InvalidUsernameLengthException);
    });

    it('should throw InvalidUsernameLengthException for username longer than 30 chars', () => {
      const tooLong = 'a'.repeat(31);

      expect(() => new UsernameValueObject(tooLong)).toThrow(InvalidUsernameLengthException);
    });

    it('should throw InvalidUsernameFormatException for username with spaces', () => {
      expect(() => new UsernameValueObject('john doe')).toThrow(InvalidUsernameFormatException);
    });

    it('should throw InvalidUsernameFormatException for username with special chars', () => {
      expect(() => new UsernameValueObject('john@doe')).toThrow(InvalidUsernameFormatException);
    });

    it('should throw InvalidUsernameFormatException for username with hyphens', () => {
      expect(() => new UsernameValueObject('john-doe')).toThrow(InvalidUsernameFormatException);
    });
  });

  describe('static constants', () => {
    it('should expose MIN_LENGTH as 3', () => {
      expect(UsernameValueObject.MIN_LENGTH).toBe(3);
    });

    it('should expose MAX_LENGTH as 30', () => {
      expect(UsernameValueObject.MAX_LENGTH).toBe(30);
    });
  });
});
