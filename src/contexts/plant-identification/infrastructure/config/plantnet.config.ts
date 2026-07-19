import { ConfigType, registerAs } from '@nestjs/config';

import { PlantNetApiKeyMissingException } from '@contexts/plant-identification/infrastructure/exceptions/plantnet-api-key-missing.exception';

export const DEFAULT_PLANTNET_PROJECT = 'all';
export const DEFAULT_PLANTNET_MIN_CONFIDENCE = 0.2;
export const DEFAULT_PLANTNET_TIMEOUT_MS = 15_000;

/**
 * Configuration for the `plant-identification` context's PlantNet adapter.
 *
 * - `PLANTNET_API_KEY` — required, secret. Fails fast at bootstrap if unset
 *   (mirrors `files`' `FILES_STORAGE_DRIVER=s3` required-var pattern) —
 *   there is no meaningful default for a third-party API credential.
 * - `PLANTNET_PROJECT` — optional dataset/project slug, default `all`
 *   (PlantNet's world flora dataset).
 * - `PLANTNET_MIN_CONFIDENCE` — optional score threshold (`0`–`1`) above
 *   which the top candidate auto-resolves, default `0.2`.
 */
export const plantnetConfig = registerAs('plantnet', () => {
  const apiKey = process.env.PLANTNET_API_KEY ?? '';

  if (!apiKey) {
    throw new PlantNetApiKeyMissingException();
  }

  const rawMinConfidence = Number.parseFloat(
    process.env.PLANTNET_MIN_CONFIDENCE ?? '',
  );
  const minConfidence =
    Number.isFinite(rawMinConfidence) &&
    rawMinConfidence >= 0 &&
    rawMinConfidence <= 1
      ? rawMinConfidence
      : DEFAULT_PLANTNET_MIN_CONFIDENCE;

  return {
    apiKey,
    project: process.env.PLANTNET_PROJECT || DEFAULT_PLANTNET_PROJECT,
    minConfidence,
    timeoutMs: DEFAULT_PLANTNET_TIMEOUT_MS,
  };
});

export type PlantNetConfig = ConfigType<typeof plantnetConfig>;
