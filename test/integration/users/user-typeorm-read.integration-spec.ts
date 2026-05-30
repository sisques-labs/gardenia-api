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
  });

  it('returns only users from the active space via findById', async () => {
    let userAId: string;
    let userBId: string;

    await ctx.spaceContext.run(spaceAId, async () => {
      const saved = await userWriteRepo.save(buildUser('user_a'));
      userAId = saved.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const saved = await userWriteRepo.save(buildUser('user_b'));
      userBId = saved.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      expect(await userReadRepo.findById(userAId)).not.toBeNull();
      expect(await userReadRepo.findById(userBId!)).toBeNull();
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      expect(await userReadRepo.findById(userBId!)).not.toBeNull();
      expect(await userReadRepo.findById(userAId!)).toBeNull();
    });
  });

  it('returns only users from the active space via findByCriteria', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await userWriteRepo.save(buildUser('alpha'));
      await userWriteRepo.save(buildUser('beta'));
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      await userWriteRepo.save(buildUser('gamma'));
    });

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
});
