import { ConfigService } from '@nestjs/config';
import { TokenEncryptionService } from './token-encryption.service';

// A valid 32-byte key, base64-encoded
const VALID_KEY = Buffer.alloc(32).fill('k').toString('base64');

function makeService(key = VALID_KEY): TokenEncryptionService {
  const configService = {
    get: jest.fn().mockReturnValue(key),
  } as unknown as ConfigService;
  return new TokenEncryptionService(configService);
}

describe('TokenEncryptionService', () => {
  it('should encrypt and decrypt a plain text token roundtrip', () => {
    const service = makeService();
    const plain = 'ya29.google-access-token-abc123';
    const encrypted = service.encrypt(plain);

    expect(encrypted).not.toBe(plain);
    expect(encrypted.split(':').length).toBe(3);

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plain);
  });

  it('should produce different ciphertexts for the same plaintext (random IV)', () => {
    const service = makeService();
    const plain = 'same-token';
    const enc1 = service.encrypt(plain);
    const enc2 = service.encrypt(plain);
    expect(enc1).not.toBe(enc2);
  });

  it('should throw when decrypting with a different key', () => {
    const service1 = makeService();
    const otherKey = Buffer.alloc(32).fill('x').toString('base64');
    const service2 = makeService(otherKey);

    const encrypted = service1.encrypt('secret-token');
    expect(() => service2.decrypt(encrypted)).toThrow();
  });

  it('should throw when initialized with a non-32-byte key', () => {
    const shortKey = Buffer.alloc(16).fill('k').toString('base64');
    expect(() => makeService(shortKey)).toThrow(
      'OAUTH_TOKEN_ENC_KEY must be a 32-byte (256-bit) base64-encoded key',
    );
  });

  it('should throw when decrypting an invalid format', () => {
    const service = makeService();
    expect(() => service.decrypt('invalid-format')).toThrow(
      'Invalid encrypted token format',
    );
  });
});
