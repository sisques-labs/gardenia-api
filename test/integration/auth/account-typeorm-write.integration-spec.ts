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
import { seedSpaceWithUser, seedUser } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');
const SHARED_EMAIL = 'tenant-user@example.com';
const PASSWORD_HASH = '$2b$10$testhashfortenantisolationtests000000000000000';

function buildAccount(userId: string, email: string) {
  return new AccountBuilder()
    .withId(randomUUID())
    .withUserId(userId)
    .withEmail(email)
    .withPasswordHash(PASSWORD_HASH)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('AccountTypeOrmWriteRepository (integration)', () => {
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

  it('allows the same email in different spaces', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await accountWriteRepo.save(buildAccount(userAId, SHARED_EMAIL));
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const saved = await accountWriteRepo.save(
        buildAccount(userBId, SHARED_EMAIL),
      );
      expect(saved.email.value).toBe(SHARED_EMAIL);
    });
  });

  it('rejects duplicate email within the same space', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await accountWriteRepo.save(buildAccount(userAId, SHARED_EMAIL));
    });

    await expect(
      ctx.spaceContext.run(spaceAId, async () => {
        const duplicateUserId = randomUUID();
        await seedUser(ctx.dataSource, duplicateUserId, spaceAId, 'dup_user');
        await accountWriteRepo.save(
          buildAccount(duplicateUserId, SHARED_EMAIL),
        );
      }),
    ).rejects.toThrow();
  });

  it('scopes findById to the active space context', async () => {
    let accountId: string;

    await ctx.spaceContext.run(spaceAId, async () => {
      const saved = await accountWriteRepo.save(
        buildAccount(userAId, 'scoped@example.com'),
      );
      accountId = saved.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const found = await accountWriteRepo.findById(accountId);
      expect(found).not.toBeNull();
      expect(found!.email.value).toBe('scoped@example.com');
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const found = await accountWriteRepo.findById(accountId);
      expect(found).toBeNull();
    });
  });
});
