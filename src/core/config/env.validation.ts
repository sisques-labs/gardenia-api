import { z } from 'zod';

import { validateProductionCorsOrigins } from './cors-origins';

const PLACEHOLDER_PATTERN = /^change_me/i;

function isValidOAuthTokenEncKey(value: string): boolean {
  return Buffer.from(value, 'base64').length === 32;
}

function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map(
      (issue) =>
        `  - ${issue.path.length > 0 ? issue.path.join('.') : '(root)'}: ${issue.message}`,
    )
    .join('\n');
}

const baseEnvSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    JWT_SECRET: z.string().trim().min(1, 'JWT_SECRET must not be empty'),
    OAUTH_TOKEN_ENC_KEY: z
      .string()
      .trim()
      .min(1, 'OAUTH_TOKEN_ENC_KEY must not be empty')
      .refine(
        isValidOAuthTokenEncKey,
        'OAUTH_TOKEN_ENC_KEY must be a 32-byte (256-bit) base64-encoded key',
      ),
    OAUTH_STATE_SECRET: z
      .string()
      .trim()
      .min(1, 'OAUTH_STATE_SECRET must not be empty'),
    QR_BASE_URL: z.string().trim().min(1, 'QR_BASE_URL must not be empty'),
    DATABASE_DRIVER: z.string().optional(),
    DATABASE_HOST: z.string().trim().min(1, 'DATABASE_HOST must not be empty'),
    DATABASE_PORT: z.string().optional(),
    DATABASE_USERNAME: z
      .string()
      .trim()
      .min(1, 'DATABASE_USERNAME must not be empty'),
    DATABASE_PASSWORD: z.string().min(1, 'DATABASE_PASSWORD must not be empty'),
    DATABASE_DATABASE: z
      .string()
      .trim()
      .min(1, 'DATABASE_DATABASE must not be empty'),
    SENTRY_DSN: z.string().optional(),
    SENTRY_ENVIRONMENT: z.string().optional(),
    SENTRY_RELEASE: z.string().optional(),
    SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
    SENTRY_PROFILE_SESSION_SAMPLE_RATE: z.coerce
      .number()
      .min(0)
      .max(1)
      .optional(),
    KAFKA_ENABLED: z.enum(['true', 'false']).optional(),
    KAFKA_BROKERS: z.string().optional(),
    KAFKA_CLIENT_ID: z.string().optional(),
    KAFKA_TOPIC_PREFIX: z.string().optional(),
    KAFKA_SSL: z.enum(['true', 'false']).optional(),
    KAFKA_SASL_MECHANISM: z
      .enum(['plain', 'scram-sha-256', 'scram-sha-512'])
      .optional(),
    KAFKA_SASL_USERNAME: z.string().optional(),
    KAFKA_SASL_PASSWORD: z.string().optional(),
    REDIS_HOST: z.string().trim().min(1, 'REDIS_HOST must not be empty'),
    REDIS_PORT: z.string().optional(),
    REDIS_PASSWORD: z.string().optional(),
    WEB_PUSH_VAPID_PUBLIC_KEY: z
      .string()
      .trim()
      .min(1, 'WEB_PUSH_VAPID_PUBLIC_KEY must not be empty'),
    WEB_PUSH_VAPID_PRIVATE_KEY: z
      .string()
      .trim()
      .min(1, 'WEB_PUSH_VAPID_PRIVATE_KEY must not be empty'),
    WEB_PUSH_VAPID_SUBJECT: z
      .string()
      .trim()
      .min(1, 'WEB_PUSH_VAPID_SUBJECT must not be empty'),
  })
  .superRefine((env, ctx) => {
    if (env.KAFKA_ENABLED === 'true' && !env.KAFKA_BROKERS?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['KAFKA_BROKERS'],
        message: 'KAFKA_BROKERS is required when KAFKA_ENABLED is "true"',
      });
    }
  });

export function validateProductionSecrets(env: {
  JWT_SECRET: string;
  OAUTH_TOKEN_ENC_KEY: string;
  OAUTH_STATE_SECRET: string;
}): string[] {
  const errors: string[] = [];

  if (PLACEHOLDER_PATTERN.test(env.JWT_SECRET)) {
    errors.push(
      '  - JWT_SECRET: must not use a placeholder value in production',
    );
  } else if (env.JWT_SECRET.length < 32) {
    errors.push('  - JWT_SECRET: must be at least 32 characters in production');
  }

  if (PLACEHOLDER_PATTERN.test(env.OAUTH_STATE_SECRET)) {
    errors.push(
      '  - OAUTH_STATE_SECRET: must not use a placeholder value in production',
    );
  } else if (env.OAUTH_STATE_SECRET.length < 32) {
    errors.push(
      '  - OAUTH_STATE_SECRET: must be at least 32 characters in production',
    );
  }

  if (PLACEHOLDER_PATTERN.test(env.OAUTH_TOKEN_ENC_KEY)) {
    errors.push(
      '  - OAUTH_TOKEN_ENC_KEY: must not use a placeholder value in production',
    );
  }

  return errors;
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = baseEnvSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(
      `Environment validation failed:\n${formatZodIssues(parsed.error.issues)}`,
    );
  }

  if (parsed.data.NODE_ENV === 'production') {
    const productionErrors = [
      ...validateProductionSecrets(parsed.data),
      ...validateProductionCorsOrigins({
        CORS_ORIGINS:
          typeof config.CORS_ORIGINS === 'string'
            ? config.CORS_ORIGINS
            : undefined,
        FRONTEND_URL:
          typeof config.FRONTEND_URL === 'string'
            ? config.FRONTEND_URL
            : undefined,
      }),
    ];

    if (productionErrors.length > 0) {
      throw new Error(
        `Environment validation failed:\n${productionErrors.join('\n')}`,
      );
    }
  }

  return config;
}
