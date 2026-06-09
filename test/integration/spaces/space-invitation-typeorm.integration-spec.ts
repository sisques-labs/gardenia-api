import { randomUUID } from 'crypto';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import {
  ISpaceInvitationReadRepository,
  SPACE_INVITATION_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/space-invitation-read.repository';
import {
  ISpaceInvitationWriteRepository,
  SPACE_INVITATION_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { SpaceContext } from '@shared/space-context/space-context.service';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2026-06-09T12:00:00.000Z');
const EXPIRES = new Date('2026-06-10T12:00:00.000Z');

describe('SpaceInvitation persistence (integration)', () => {
  let ctx: IntegrationContext;
  let spaceWriteRepo: ISpaceWriteRepository;
  let invitationWriteRepo: ISpaceInvitationWriteRepository;
  let invitationReadRepo: ISpaceInvitationReadRepository;
  let spaceContext: SpaceContext;

  const spaceId = randomUUID();
  const ownerId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [SpacesModule] });
    spaceWriteRepo = ctx.module.get(SPACE_WRITE_REPOSITORY);
    invitationWriteRepo = ctx.module.get(SPACE_INVITATION_WRITE_REPOSITORY);
    invitationReadRepo = ctx.module.get(SPACE_INVITATION_READ_REPOSITORY);
    spaceContext = ctx.module.get(SpaceContext);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    const space = new SpaceBuilder()
      .withId(spaceId)
      .withName('Limonero')
      .withOwnerId(ownerId)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();
    space.create();
    space.addMember(ownerId, MembershipRoleEnum.OWNER);
    await spaceWriteRepo.save(space);
  });

  it('persists invitation and finds by code globally', async () => {
    const invitation = new SpaceInvitationBuilder()
      .withId(randomUUID())
      .withSpaceId(spaceId)
      .withCreatedByUserId(ownerId)
      .withRole(MembershipRoleEnum.MEMBER)
      .withCode('LIM2026K0')
      .withDisplayCode('LIM · 2026 · K0')
      .withQrId(randomUUID())
      .withExpiresAt(EXPIRES)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();

    invitation.create();

    await spaceContext.run(spaceId, async () => {
      await invitationWriteRepo.save(invitation);
    });

    const found = await invitationReadRepo.findByCode('lim · 2026 · k0');
    expect(found).not.toBeNull();
    expect(found?.code).toBe('LIM2026K0');
    expect(found?.spaceId).toBe(spaceId);
  });

  it('tenant-scoped criteria only returns invitations for active space', async () => {
    const otherSpaceId = randomUUID();

    const otherSpace = new SpaceBuilder()
      .withId(otherSpaceId)
      .withName('Other')
      .withOwnerId(ownerId)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();
    otherSpace.create();
    otherSpace.addMember(ownerId, MembershipRoleEnum.OWNER);
    await spaceWriteRepo.save(otherSpace);

    const saveInvitation = async (id: string, sid: string, code: string) => {
      const inv = new SpaceInvitationBuilder()
        .withId(id)
        .withSpaceId(sid)
        .withCreatedByUserId(ownerId)
        .withCode(code)
        .withDisplayCode(code)
        .withExpiresAt(EXPIRES)
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW)
        .build();
      inv.create();
      await spaceContext.run(sid, async () => {
        await invitationWriteRepo.save(inv);
      });
    };

    await saveInvitation(randomUUID(), spaceId, 'CODEA2026AA');
    await saveInvitation(randomUUID(), otherSpaceId, 'CODEB2026BB');

    const result = await spaceContext.run(spaceId, async () =>
      invitationReadRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'spaceId',
              operator: FilterOperator.EQUALS,
              value: spaceId,
            },
          ],
          [],
          { page: 1, perPage: 10 },
        ),
      ),
    );

    expect(result.total).toBe(1);
    expect(result.items[0].code).toBe('CODEA2026AA');
  });
});
