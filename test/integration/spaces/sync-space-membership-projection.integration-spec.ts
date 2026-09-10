import { randomUUID } from 'crypto';
import * as http from 'http';
import { AddressInfo } from 'net';

import { CommandBus } from '@nestjs/cqrs';

import { SyncSpaceMembershipProjectionCommand } from '@contexts/spaces/application/commands/sync-space-membership-projection/sync-space-membership-projection.command';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { SpacesModule } from '@contexts/spaces/spaces.module';
import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');

/**
 * Exercises the REAL `AccountApiTenantMembershipAdapter` (`HttpService` →
 * axios) against a local mock HTTP server, and the REAL Postgres membership
 * projection table via `SyncSpaceMembershipProjectionCommandHandler` — the
 * account-api-tenant adapters' integration coverage explicitly deferred from
 * PR2/PR3 (tasks.md Phase 8.3), plus the reconcile/delete-on-403 scenarios.
 */
describe('SyncSpaceMembershipProjectionCommandHandler (integration, real Postgres + mock HTTP)', () => {
  let ctx: IntegrationContext;
  let commandBus: CommandBus;
  let spaceWriteRepo: ISpaceWriteRepository;
  let membershipReadRepo: IMembershipReadRepository;
  let mockServer: http.Server;
  let mockServerHandler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ) => void;

  const tenantId = randomUUID();
  const ownerId = randomUUID();
  const otherOwnerId = randomUUID();

  beforeAll(async () => {
    mockServer = http.createServer((req, res) => mockServerHandler(req, res));
    await new Promise<void>((resolve) => mockServer.listen(0, resolve));
    const port = (mockServer.address() as AddressInfo).port;
    process.env.SISQUES_ACCOUNT_API_URL = `http://127.0.0.1:${port}`;
    process.env.SISQUES_ACCOUNT_APP_ID = 'gardenia-test-app';

    ctx = await createIntegrationModule({ imports: [SpacesModule] });
    // See refresh-token-race.integration-spec.ts's comment: CqrsModule binds
    // handlers to buses in onApplicationBootstrap, which never fires unless
    // the TestingModule is explicitly init()'d.
    await ctx.module.init();

    commandBus = ctx.module.get(CommandBus);
    spaceWriteRepo = ctx.module.get(SPACE_WRITE_REPOSITORY);
    membershipReadRepo = ctx.module.get(MEMBERSHIP_READ_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
    await new Promise<void>((resolve) => mockServer.close(() => resolve()));
    delete process.env.SISQUES_ACCOUNT_API_URL;
    delete process.env.SISQUES_ACCOUNT_APP_ID;
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    const space = new SpaceBuilder()
      .withId(tenantId)
      .withName('Platform-Linked Space')
      .withOwnerId(ownerId)
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();
    space.create();
    space.addMember(ownerId, MembershipRoleEnum.OWNER);
    await spaceWriteRepo.save(space);
  });

  async function findRow(userId: string) {
    const result = await membershipReadRepo.findByCriteria(
      new Criteria(
        [
          { field: 'userId', operator: FilterOperator.EQUALS, value: userId },
          {
            field: 'spaceId',
            operator: FilterOperator.EQUALS,
            value: tenantId,
          },
        ],
        [],
        { page: 1, perPage: 10 },
      ),
    );
    return result.total > 0 ? result.items[0] : null;
  }

  it('upserts synced_at and role when the platform confirms membership (200)', async () => {
    mockServerHandler = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ userId: ownerId, role: 'owner' }]));
    };

    const allowed = await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: ownerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );

    expect(allowed).toBe(true);
    const row = await findRow(ownerId);
    expect(row).not.toBeNull();
    expect(row!.role.value).toBe(MembershipRoleEnum.OWNER);
    expect(row!.syncedAt).not.toBeNull();
  });

  it('deletes the row when the platform confirms revocation (403)', async () => {
    // Seed a fresh row via a prior successful sync.
    mockServerHandler = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ userId: otherOwnerId, role: 'member' }]));
    };
    await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: otherOwnerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );
    expect(await findRow(otherOwnerId)).not.toBeNull();

    mockServerHandler = (_req, res) => {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Forbidden' }));
    };

    const allowed = await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: otherOwnerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );

    expect(allowed).toBe(false);
    expect(await findRow(otherOwnerId)).toBeNull();
  });

  it('leaves an existing row untouched and allows access when the platform 5xxs', async () => {
    mockServerHandler = (_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify([{ userId: ownerId, role: 'owner' }]));
    };
    await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: ownerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );
    const before = await findRow(ownerId);

    mockServerHandler = (_req, res) => {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Service Unavailable' }));
    };

    const allowed = await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: ownerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );

    expect(allowed).toBe(true);
    const after = await findRow(ownerId);
    expect(after!.syncedAt).toEqual(before!.syncedAt);
  });

  it('fails closed (denies) when the platform 5xxs and no row exists', async () => {
    mockServerHandler = (_req, res) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal Error' }));
    };

    const allowed = await commandBus.execute(
      new SyncSpaceMembershipProjectionCommand({
        tenantId,
        userId: otherOwnerId,
        callerAccessToken: 'raw-caller-token',
      }),
    );

    expect(allowed).toBe(false);
    expect(await findRow(otherOwnerId)).toBeNull();
  });
});
