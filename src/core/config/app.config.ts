import { registerAs } from '@nestjs/config';

import { resolveCorsOrigins } from './cors-origins';

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
    nodeEnv: process.env.NODE_ENV ?? 'development',
    frontendUrl: (process.env.FRONTEND_URL ?? 'http://localhost:3001').replace(
      /\/$/,
      '',
    ),
    corsOrigins: resolveCorsOrigins({
      CORS_ORIGINS: process.env.CORS_ORIGINS,
      FRONTEND_URL: process.env.FRONTEND_URL,
      NODE_ENV: process.env.NODE_ENV,
    }),
  };
});
