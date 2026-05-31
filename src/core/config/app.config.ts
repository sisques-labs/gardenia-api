import { registerAs } from '@nestjs/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(`Missing environment variable "${name}"`);
  }
  return value.trim();
}

export const appConfig = registerAs('app', () => {
  const raw = requireEnv('QR_BASE_URL');
  return {
    qrBaseUrl: raw.replace(/\/$/, ''),
  };
});
