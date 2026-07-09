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
import { UserQueryableField } from '@contexts/users/transport/graphql/enums/user/user-queryable-field.enum';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { seedMembership, seedSpace } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');

describe('UserTypeOrmReadRepository (integration)', () => {
  let ctx: IntegrationContext;
  let userWriteRepo: IUserWriteRepository;
  let userReadRepo: IUserReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  // Mirrors what the real write path does on signup/space-creation: a user
  // row plus a space_memberships row for its home space. The read repo now
  // resolves membership exclusively via the join, so tests must seed both.
  async function saveUserWithMembership(
    homeSpaceId: string,
    username: string,
    status: UserStatusEnum = UserStatusEnum.ACTIVE,
  ): Promise<string> {
    let userId!: string;

    await ctx.spaceContext.run(homeSpaceId, async () => {
      const saved = await userWriteRepo.save(
        new UserBuilder()
          .withId(randomUUID())
          .withUsername(username)
          .withStatus(status)
          .withCreatedAt(NOW)
          .withUpdatedAt(NOW)
          .build(),
      );
      userId = saved.id.value;
    });

    await seedMembership(ctx.dataSource, homeSpaceId, userId);
    return userId;
  }

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

  it('returns only users from the active space via findById', async () => {
    const userAId = await saveUserWithMembership(spaceAId, 'user_a');
    const userBId = await saveUserWithMembership(spaceBId, 'user_b');

    await ctx.spaceContext.run(spaceAId, async () => {
      expect(await userReadRepo.findById(userAId)).not.toBeNull();
      expect(await userReadRepo.findById(userBId)).toBeNull();
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      expect(await userReadRepo.findById(userBId)).not.toBeNull();
      expect(await userReadRepo.findById(userAId)).toBeNull();
    });
  });

  it('returns only users from the active space via findByCriteria', async () => {
    await saveUserWithMembership(spaceAId, 'alpha');
    await saveUserWithMembership(spaceAId, 'beta');
    await saveUserWithMembership(spaceBId, 'gamma');

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

  it('applies a LIKE filter on username', async () => {
    await saveUserWithMembership(spaceAId, 'alpha_gardener');
    await saveUserWithMembership(spaceAId, 'beta_gardener');
    await saveUserWithMembership(spaceAId, 'zzz_other');

    await ctx.spaceContext.run(spaceAId, async () => {
      const result = await userReadRepo.findByCriteria(
        new Criteria(
          [
            {
              field: UserQueryableField.USERNAME,
              operator: FilterOperator.LIKE,
              value: 'gardener',
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );

      expect(result.items.map((u) => u.username).sort()).toEqual([
        'alpha_gardener',
        'beta_gardener',
      ]);
    });
  });

  it('applies an EQUALS filter on status', async () => {
    await saveUserWithMembership(spaceAId, 'active_user');
    await saveUserWithMembership(
      spaceAId,
      'blocked_user',
      UserStatusEnum.BLOCKED,
    );

    await ctx.spaceContext.run(spaceAId, async () => {
      const result = await userReadRepo.findByCriteria(
        new Criteria(
          [
            {
              field: UserQueryableField.STATUS,
              operator: FilterOperator.EQUALS,
              value: UserStatusEnum.BLOCKED,
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].username).toBe('blocked_user');
    });
  });

  describe('invited members (space_memberships-only, no home users.space_id match)', () => {
    it('findById resolves a member whose home space differs from the active space', async () => {
      const invitedUserId = await saveUserWithMembership(
        spaceBId,
        'invited_guest',
      );
      // Invitation accepted into Space A — membership only, no users row change.
      await seedMembership(ctx.dataSource, spaceAId, invitedUserId);

      await ctx.spaceContext.run(spaceAId, async () => {
        const found = await userReadRepo.findById(invitedUserId);
        expect(found).not.toBeNull();
        expect(found!.username).toBe('invited_guest');
      });
    });

    it('findByCriteria lists an invited member alongside home-space members', async () => {
      await saveUserWithMembership(spaceAId, 'owner_a');
      const invitedUserId = await saveUserWithMembership(
        spaceBId,
        'invited_guest',
      );
      await seedMembership(ctx.dataSource, spaceAId, invitedUserId);

      await ctx.spaceContext.run(spaceAId, async () => {
        const result = await userReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );

        expect(result.items.map((u) => u.username).sort()).toEqual([
          'invited_guest',
          'owner_a',
        ]);
      });
    });

    it('does not leak a non-member into the space listing merely because it is their home space_id', async () => {
      // Simulates a stale/legacy users.space_id row with no membership row.
      const userId = randomUUID();
      await ctx.spaceContext.run(spaceAId, async () => {
        await userWriteRepo.save(
          new UserBuilder()
            .withId(userId)
            .withUsername('no_membership_user')
            .withStatus(UserStatusEnum.ACTIVE)
            .withCreatedAt(NOW)
            .withUpdatedAt(NOW)
            .build(),
        );
      });

      await ctx.spaceContext.run(spaceAId, async () => {
        expect(await userReadRepo.findById(userId)).toBeNull();

        const result = await userReadRepo.findByCriteria(
          new Criteria([], [], { page: 1, perPage: 10 }),
        );
        expect(result.items).toHaveLength(0);
      });
    });
  });
});
