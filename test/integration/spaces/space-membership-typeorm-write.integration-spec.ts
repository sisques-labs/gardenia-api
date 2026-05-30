import { randomUUID } from 'crypto';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');

function buildSpaceWithOwner(spaceId: string, ownerId: string, name: string) {
  const space = new SpaceBuilder()
    .withId(spaceId)
    .withName(name)
    .withOwnerId(ownerId)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();

  space.create();
  space.addMember(ownerId, MembershipRoleEnum.OWNER);
  return space;
}

describe('Space membership persistence (integration)', () => {
  let ctx: IntegrationContext;
  let spaceWriteRepo: ISpaceWriteRepository;
  let membershipReadRepo: IMembershipReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const ownerAId = randomUUID();
  const ownerBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [SpacesModule] });
    spaceWriteRepo = ctx.module.get(SPACE_WRITE_REPOSITORY);
    membershipReadRepo = ctx.module.get(MEMBERSHIP_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('persists memberships per space and filters reads by spaceId', async () => {
    await spaceWriteRepo.save(
      buildSpaceWithOwner(spaceAId, ownerAId, 'Space A'),
    );
    await spaceWriteRepo.save(
      buildSpaceWithOwner(spaceBId, ownerBId, 'Space B'),
    );

    const spaceAResult = await membershipReadRepo.findByCriteria(
      new Criteria(
        [
          {
            field: 'spaceId',
            operator: FilterOperator.EQUALS,
            value: spaceAId,
          },
        ],
        [],
        { page: 1, perPage: 10 },
      ),
    );

    const spaceBResult = await membershipReadRepo.findByCriteria(
      new Criteria(
        [
          {
            field: 'spaceId',
            operator: FilterOperator.EQUALS,
            value: spaceBId,
          },
        ],
        [],
        { page: 1, perPage: 10 },
      ),
    );

    expect(spaceAResult.items).toHaveLength(1);
    expect(spaceAResult.items[0].spaceId).toBe(spaceAId);
    expect(spaceAResult.items[0].userId).toBe(ownerAId);

    expect(spaceBResult.items).toHaveLength(1);
    expect(spaceBResult.items[0].spaceId).toBe(spaceBId);
    expect(spaceBResult.items[0].userId).toBe(ownerBId);
  });

  it('counts owned spaces per user independently', async () => {
    await spaceWriteRepo.save(
      buildSpaceWithOwner(spaceAId, ownerAId, 'Space A'),
    );
    await spaceWriteRepo.save(
      buildSpaceWithOwner(spaceBId, ownerBId, 'Space B'),
    );

    expect(await membershipReadRepo.countByOwner(ownerAId)).toBe(1);
    expect(await membershipReadRepo.countByOwner(ownerBId)).toBe(1);
    expect(await membershipReadRepo.countByOwner(randomUUID())).toBe(0);
  });
});
