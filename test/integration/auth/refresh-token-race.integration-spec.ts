import { createHash, randomUUID } from 'crypto';

import { CommandBus } from '@nestjs/cqrs';

import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AuthSessionBuilder } from '@contexts/auth/domain/builders/auth-session.builder';
import { RefreshTokenReuseDetectedException } from '@contexts/auth/domain/exceptions/refresh-token-reuse-detected.exception';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import {
  AUTH_SESSION_WRITE_REPOSITORY,
  IAuthSessionWriteRepository,
} from '@contexts/auth/domain/repositories/write/auth-session-write.repository';
import { AuthModule } from '@contexts/auth/auth.module';
import { RefreshTokenCommand } from '@contexts/auth/application/commands/refresh-token/refresh-token.command';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2026-06-01T00:00:00.000Z');
const PASSWORD_HASH = '$2b$10$testhashforracetests000000000000000000000000';

function hashToken(plainToken: string): string {
  return createHash('sha256').update(plainToken).digest('hex');
}

describe('RefreshTokenCommandHandler race (integration)', () => {
  let ctx: IntegrationContext;
  let accountWriteRepo: IAccountWriteRepository;
  let sessionWriteRepo: IAuthSessionWriteRepository;
  let commandBus: CommandBus;

  const spaceId = randomUUID();
  const userId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({
      imports: [AuthModule],
    });
    // createIntegrationModule() only compiles the TestingModule — it never
    // becomes a running application, so Nest never fires onApplicationBootstrap.
    // @nestjs/cqrs binds command/query handlers to their buses in that hook,
    // so any integration test that dispatches through CommandBus/QueryBus
    // (unlike the repository-only integration specs elsewhere in this dir)
    // needs an explicit init() here or CommandBus.execute() throws
    // "command handler ... was not found".
    await ctx.module.init();
    accountWriteRepo = ctx.module.get(ACCOUNT_WRITE_REPOSITORY);
    sessionWriteRepo = ctx.module.get(AUTH_SESSION_WRITE_REPOSITORY);
    commandBus = ctx.module.get(CommandBus);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceId, userId, {
      spaceName: 'Race Test Space',
      username: 'race_user',
    });

    await ctx.spaceContext.run(spaceId, async () => {
      await accountWriteRepo.save(
        new AccountBuilder()
          .withId(randomUUID())
          .withUserId(userId)
          .withEmail('race@example.com')
          .withPasswordHash(PASSWORD_HASH)
          .withCreatedAt(NOW)
          .withUpdatedAt(NOW)
          .build(),
      );
    });
  });

  async function seedSession(plainToken: string): Promise<void> {
    const session = new AuthSessionBuilder()
      .withId(randomUUID())
      .withUserId(userId)
      .withTokenHash(hashToken(plainToken))
      .withExpiresAt(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .build();
    await sessionWriteRepo.save(session);
  }

  it('lets two concurrent refreshes with the same token both succeed, without revoking the user', async () => {
    const plainToken = randomUUID();
    await seedSession(plainToken);

    const [resultA, resultB] = await Promise.all([
      commandBus.execute(new RefreshTokenCommand({ refreshToken: plainToken })),
      commandBus.execute(new RefreshTokenCommand({ refreshToken: plainToken })),
    ]);

    expect(resultA.accessToken).toEqual(expect.any(String));
    expect(resultB.accessToken).toEqual(expect.any(String));
    expect(resultA.refreshToken).not.toBe(resultB.refreshToken);

    const rows: Array<{ revokedAt: Date | null }> = await ctx.dataSource.query(
      'SELECT "revokedAt" FROM "auth_sessions" WHERE "userId" = $1',
      [userId],
    );

    // Both requests present the identical original token, so Postgres's
    // pessimistic lock serializes them onto the same lineage: request 1 does
    // the normal rotation (seed -> S2); request 2, once unblocked, finds the
    // seed already revoked and chains via the grace path (S2 -> S3). Net:
    // seed + 2 sessions born from the race, with only the newest (S3) still
    // valid — S2 gets consumed as a side effect of the second request's
    // grace-chain, same as it would from a legitimate follow-up refresh.
    expect(rows).toHaveLength(3);
    // The key invariant: this is NOT a revoke-all. Exactly one survives
    // (never zero) — the user is never fully logged out by the race.
    expect(rows.filter((r) => r.revokedAt === null)).toHaveLength(1);
  });

  it('treats a third replay of the original token as real reuse and revokes everything', async () => {
    const plainToken = randomUUID();
    await seedSession(plainToken);

    await Promise.all([
      commandBus.execute(new RefreshTokenCommand({ refreshToken: plainToken })),
      commandBus.execute(new RefreshTokenCommand({ refreshToken: plainToken })),
    ]);

    await expect(
      commandBus.execute(new RefreshTokenCommand({ refreshToken: plainToken })),
    ).rejects.toThrow(RefreshTokenReuseDetectedException);

    const rows: Array<{ revokedAt: Date | null }> = await ctx.dataSource.query(
      'SELECT "revokedAt" FROM "auth_sessions" WHERE "userId" = $1',
      [userId],
    );

    expect(rows.every((r) => r.revokedAt !== null)).toBe(true);
  });
});
