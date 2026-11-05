import { randomUUID } from 'crypto';

import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { AuthModule } from '@contexts/auth/auth.module';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');
const PASSWORD_HASH = '$2b$10$testhashforexternalsubjecttests00000000000000';

function buildAccount(
  userId: string,
  email: string,
  externalSubject: string | null,
) {
  return new AccountBuilder()
    .withId(randomUUID())
    .withUserId(userId)
    .withEmail(email)
    .withPasswordHash(PASSWORD_HASH)
    .withExternalSubject(externalSubject)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('AccountTypeOrmWriteRepository — external_subject (integration)', () => {
  let ctx: IntegrationContext;
  let accountWriteRepo: IAccountWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [AuthModule] });
    accountWriteRepo = ctx.module.get(ACCOUNT_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceAId, userAId, {
      spaceName: 'Space A',
      username: 'user_a',
    });
    await seedSpaceWithUser(ctx.dataSource, spaceBId, userBId, {
      spaceName: 'Space B',
      username: 'user_b',
    });
  });

  it('permits many accounts with a NULL external_subject', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await accountWriteRepo.save(
        buildAccount(userAId, 'unlinked-a@example.com', null),
      );
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const saved = await accountWriteRepo.save(
        buildAccount(userBId, 'unlinked-b@example.com', null),
      );
      expect(saved.externalSubject).toBeNull();
    });
  });

  it('rejects a duplicate external_subject across different accounts (global, not space-scoped)', async () => {
    const sharedSubject = 'platform-subject-shared';

    await ctx.spaceContext.run(spaceAId, async () => {
      await accountWriteRepo.save(
        buildAccount(userAId, 'linked-a@example.com', sharedSubject),
      );
    });

    await expect(
      ctx.spaceContext.run(spaceBId, async () => {
        await accountWriteRepo.save(
          buildAccount(userBId, 'linked-b@example.com', sharedSubject),
        );
      }),
    ).rejects.toThrow();
  });

  it('findByExternalSubject bypasses the tenant proxy, like findByEmail', async () => {
    const subject = 'platform-subject-bypass';

    await ctx.spaceContext.run(spaceAId, async () => {
      await accountWriteRepo.save(
        buildAccount(userAId, 'bypass-a@example.com', subject),
      );
    });

    // No active space context — global lookups must still resolve the row.
    const found = await accountWriteRepo.findByExternalSubject(subject);

    expect(found).not.toBeNull();
    expect(found!.email.value).toBe('bypass-a@example.com');
  });

  it('findByExternalSubject returns null when no account is linked to that subject', async () => {
    const found = await accountWriteRepo.findByExternalSubject(
      'never-linked-subject',
    );

    expect(found).toBeNull();
  });
});
