import { z } from 'zod';

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

const baseEnvSchema = z.object({
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
    const productionErrors = validateProductionSecrets(parsed.data);

    if (productionErrors.length > 0) {
      throw new Error(
        `Environment validation failed:\n${productionErrors.join('\n')}`,
      );
    }
  }

  return config;
}
