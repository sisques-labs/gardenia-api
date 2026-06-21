import { createHash, randomUUID } from 'crypto';

import { AuthModule } from '@contexts/auth/auth.module';
import { ApiTokenBuilder } from '@contexts/auth/domain/builders/api-token.builder';
import {
  API_TOKEN_WRITE_REPOSITORY,
  IApiTokenWriteRepository,
} from '@contexts/auth/domain/repositories/write/api-token-write.repository';

import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';

const NOW = new Date('2026-06-01T00:00:00.000Z');

function hashOf(seed: string): string {
  // Deterministic 64-char hex digest, valid for ApiTokenHashValueObject.
  return createHash('sha256').update(seed).digest('hex');
}

function buildToken(
  builder: ApiTokenBuilder,
  overrides: Partial<{
    userId: string;
    spaceId: string;
    label: string;
    hash: string;
    revokedAt: Date | null;
  }> = {},
) {
  return builder
    .withId(randomUUID())
    .withUserId(overrides.userId ?? randomUUID())
    .withSpaceId(overrides.spaceId ?? randomUUID())
    .withLabel(overrides.label ?? 'Home Assistant')
    .withTokenHash(overrides.hash ?? hashOf('a'))
    .withRevokedAt(overrides.revokedAt ?? null)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('ApiTokenTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let repo: IApiTokenWriteRepository;
  let builder: ApiTokenBuilder;

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [AuthModule] });
    repo = ctx.module.get(API_TOKEN_WRITE_REPOSITORY);
    builder = ctx.module.get(ApiTokenBuilder);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('persists and finds a token by its hash', async () => {
    const hash = hashOf('lookup');
    await repo.save(buildToken(builder, { hash }));

    const found = await repo.findByTokenHash(hash);
    expect(found).not.toBeNull();
    expect(found!.tokenHash.value).toBe(hash);
    expect(found!.label.value).toBe('Home Assistant');
  });

  it('returns null for an unknown hash', async () => {
    expect(await repo.findByTokenHash(hashOf('missing'))).toBeNull();
  });

  it('enforces a unique token hash', async () => {
    const hash = hashOf('dup');
    await repo.save(buildToken(builder, { hash }));
    await expect(repo.save(buildToken(builder, { hash }))).rejects.toThrow();
  });

  it('lists every token for a user, newest first', async () => {
    const userId = randomUUID();
    await repo.save(buildToken(builder, { userId, hash: hashOf('one') }));
    await repo.save(buildToken(builder, { userId, hash: hashOf('two') }));
    await repo.save(buildToken(builder, { hash: hashOf('other-user') }));

    const tokens = await repo.findByUserId(userId);
    expect(tokens).toHaveLength(2);
    expect(tokens.every((t) => t.userId.value === userId)).toBe(true);
  });

  it('persists revocation', async () => {
    const hash = hashOf('revoke');
    const token = buildToken(builder, { hash });
    await repo.save(token);

    token.revoke();
    await repo.save(token);

    const found = await repo.findByTokenHash(hash);
    expect(found!.isRevoked()).toBe(true);
    expect(found!.revokedAt).toBeInstanceOf(Date);
  });
});
