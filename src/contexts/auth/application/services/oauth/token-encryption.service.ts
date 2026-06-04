import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16;

@Injectable()
export class TokenEncryptionService {
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const encKey =
      this.configService.get<string>('auth.oauthTokenEncKey') ?? '';
    // Key must be 32 bytes for AES-256. Accept base64 encoded key.
    this.key = Buffer.from(encKey, 'base64');
    if (this.key.length !== 32) {
      throw new Error(
        'OAUTH_TOKEN_ENC_KEY must be a 32-byte (256-bit) base64-encoded key',
      );
    }
  }

  encrypt(plain: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    // Format: base64(iv):base64(authTag):base64(ciphertext)
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(enc: string): string {
    const parts = enc.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format');
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
