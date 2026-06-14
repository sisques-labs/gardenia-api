import { randomUUID } from 'crypto';

import { UserStatusEnum } from '@contexts/users/domain/enums/user-status.enum';
import { UserBuilder } from '@contexts/users/domain/builders/user.builder';
import {
  IUserReadRepository,
  USER_READ_REPOSITORY,
} from '@contexts/users/domain/repositories/read/user-read.repository';
import {
  IUserWriteRepository,
  USER_WRITE_REPOSITORY,
} from '@contexts/users/domain/repositories/write/user-write.repository';
import { UsersModule } from '@contexts/users/users.module';
import { Criteria } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedSpace, seedMembership } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');

function buildUser(username: string) {
  return new UserBuilder()
    .withId(randomUUID())
    .withUsername(username)
    .withStatus(UserStatusEnum.ACTIVE)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('UserTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let userWriteRepo: IUserWriteRepository;
  let userReadRepo: IUserReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [UsersModule] });
    userWriteRepo = ctx.module.get(USER_WRITE_REPOSITORY);
    userReadRepo = ctx.module.get(USER_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpace(ctx.dataSource, spaceAId, randomUUID(), 'Space A');
    await seedSpace(ctx.dataSource, spaceBId, randomUUID(), 'Space B');
  });

  describe('findById', () => {
    it('returns a home-space user who has a membership row', async () => {
      let userId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const saved = await userWriteRepo.save(buildUser('user_a'));
        userId = saved.id.value;
      });
      await seedMembership(ctx.dataSource, spaceAId, userId!);

      await ctx.spaceContext.run(spaceAId, async () => {
        expect(await userReadRepo.findById(userId!)).not.toBeNull();
      });
    });

    it('returns null for a user with no membership in the queried space', async () => {
      let userAId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        const saved = await userWriteRepo.save(buildUser('user_a'));
        userAId = saved.id.value;
      });
      // user_a has no membership in space B
      await seedMembership(ctx.dataSource, spaceAId, userAId!);

      await ctx.spaceContext.run(spaceBId, async () => {
        expect(await userReadRepo.findById(userAId!)).toBeNull();
      });
    });

    it('returns an invited member (home space differs from queried space)', async () => {
      let invitedUserId: string;

      // invited user's home space is A
      await ctx.spaceContext.run(spaceAId, async () => {
        const saved = await userWriteRepo.save(buildUser('invited_user'));
        invitedUserId = saved.id.value;
      });
      // Only a membership row in B — no users.space_id = B
      await seedMembership(ctx.dataSource, spaceBId, invitedUserId!);

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await userReadRepo.findById(invitedUserId!);
        expect(result).not.toBeNull();
        expect(result?.username).toBe('invited_user');
      });

      // Should NOT appear in space A where no membership row was added
      await ctx.spaceContext.run(spaceAId, async () => {
        expect(await userReadRepo.findById(invitedUserId!)).toBeNull();
      });
    });
  });

  describe('findByCriteria', () => {
    it('returns only members of the active space', async () => {
      let alphaId: string;
      let betaId: string;
      let gammaId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        alphaId = (await userWriteRepo.save(buildUser('alpha'))).id.value;
        betaId = (await userWriteRepo.save(buildUser('beta'))).id.value;
      });
      await ctx.spaceContext.run(spaceBId, async () => {
        gammaId = (await userWriteRepo.save(buildUser('gamma'))).id.value;
      });

      // Only alpha and beta are members of space A
      await seedMembership(ctx.dataSource, spaceAId, alphaId!);
      await seedMembership(ctx.dataSource, spaceAId, betaId!);
      await seedMembership(ctx.dataSource, spaceBId, gammaId!);

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await userReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(2);
        expect(result.items.map((u) => u.username).sort()).toEqual([
          'alpha',
          'beta',
        ]);
      });

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await userReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(1);
        expect(result.items[0].username).toBe('gamma');
      });
    });

    it('includes invited members alongside home-space members', async () => {
      let homeUserId: string;
      let invitedUserId: string;

      // home_user registered in space B
      await ctx.spaceContext.run(spaceBId, async () => {
        homeUserId = (await userWriteRepo.save(buildUser('home_user'))).id
          .value;
      });
      // invited_user registered in space A but invited to B
      await ctx.spaceContext.run(spaceAId, async () => {
        invitedUserId = (await userWriteRepo.save(buildUser('invited_user'))).id
          .value;
      });

      await seedMembership(ctx.dataSource, spaceBId, homeUserId!);
      await seedMembership(ctx.dataSource, spaceBId, invitedUserId!);

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await userReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(2);
        expect(result.items.map((u) => u.username).sort()).toEqual([
          'home_user',
          'invited_user',
        ]);
      });
    });
  });

  describe('findByUsername', () => {
    it('returns user if they are a member of the queried space', async () => {
      let userId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        userId = (await userWriteRepo.save(buildUser('unique_name'))).id.value;
      });
      await seedMembership(ctx.dataSource, spaceAId, userId!);

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await userReadRepo.findByUsername('unique_name');
        expect(result).not.toBeNull();
        expect(result?.id.value).toBe(userId);
      });
    });

    it('returns null if user has no membership in the queried space', async () => {
      let userId: string;

      await ctx.spaceContext.run(spaceAId, async () => {
        userId = (await userWriteRepo.save(buildUser('only_in_a'))).id.value;
      });
      await seedMembership(ctx.dataSource, spaceAId, userId!);

      await ctx.spaceContext.run(spaceBId, async () => {
        const result = await userReadRepo.findByUsername('only_in_a');
        expect(result).toBeNull();
      });
    });
  });
});
