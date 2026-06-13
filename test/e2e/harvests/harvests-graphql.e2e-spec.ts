import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'harvests-gql-a@example.com';
const EMAIL_B = 'harvests-gql-b@example.com';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterAccountInput!) {
    register(input: $input)
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginUserInput!) {
    login(input: $input) {
      accessToken
    }
  }
`;

const HARVEST_CREATE_MUTATION = `
  mutation HarvestCreate($input: HarvestCreateRequestDto!) {
    harvestCreate(input: $input) {
      success
      message
      id
    }
  }
`;

const HARVEST_UPDATE_MUTATION = `
  mutation HarvestUpdate($input: HarvestUpdateRequestDto!) {
    harvestUpdate(input: $input) {
      success
      id
    }
  }
`;

const HARVEST_DELETE_MUTATION = `
  mutation HarvestDelete($input: HarvestDeleteRequestDto!) {
    harvestDelete(input: $input) {
      success
      id
    }
  }
`;

const HARVEST_FIND_BY_ID_QUERY = `
  query HarvestFindById($input: HarvestFindByIdRequestDto!) {
    harvestFindById(input: $input) {
      id
      cropType
      quantity
      unit
      spaceId
    }
  }
`;

const HARVESTS_FIND_BY_CRITERIA_QUERY = `
  query HarvestsFindByCriteria($input: HarvestFindByCriteriaRequestDto) {
    harvestsFindByCriteria(input: $input) {
      items {
        id
        cropType
        quantity
        unit
      }
      total
      page
    }
  }
`;

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await gql(ctx.app, REGISTER_MUTATION, {
    input: { email, password },
  });
  const spaceId = regRes.body.data.register as string;

  const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
    input: { email, password },
  });
  const token = loginRes.body.data.login.accessToken as string;

  return { token, spaceId };
}

describe('Harvests GraphQL API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    userA = await seedAuth(ctx, EMAIL_A, PASSWORD);
    userB = await seedAuth(ctx, EMAIL_B, PASSWORD);
  });

  // ─── harvestCreate mutation ──────────────────────────────────────────────────

  describe('mutation harvestCreate', () => {
    it('creates a harvest and returns success with id', async () => {
      const res = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate Cherry',
            quantity: 2.5,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestCreate.success).toBe(true);
      expect(typeof res.body.data.harvestCreate.id).toBe('string');
    });

    it('returns error when unauthenticated', async () => {
      const res = await gql(ctx.app, HARVEST_CREATE_MUTATION, {
        input: {
          cropType: 'Tomate',
          quantity: 1,
          unit: 'KG',
          harvestedAt: '2026-06-01T00:00:00.000Z',
        },
      }).expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('returns error when user is not a member of the requested space', async () => {
      const res = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate',
            quantity: 1,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userB.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  // ─── harvestFindById query ───────────────────────────────────────────────────

  describe('query harvestFindById', () => {
    it('returns harvest when found in the space', async () => {
      const createRes = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Pepino',
            quantity: 3,
            unit: 'PIECES',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );
      const harvestId = createRes.body.data.harvestCreate.id as string;

      const res = await gql(
        ctx.app,
        HARVEST_FIND_BY_ID_QUERY,
        { input: { id: harvestId } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestFindById).toMatchObject({
        id: harvestId,
        cropType: 'Pepino',
        unit: 'PIECES',
        spaceId: userA.spaceId,
      });
    });

    it('returns error when harvest belongs to a different space', async () => {
      const createRes = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate',
            quantity: 1,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );
      const harvestId = createRes.body.data.harvestCreate.id as string;

      const res = await gql(
        ctx.app,
        HARVEST_FIND_BY_ID_QUERY,
        { input: { id: harvestId } },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  // ─── harvestsFindByCriteria query ────────────────────────────────────────────

  describe('query harvestsFindByCriteria', () => {
    it('returns all harvests in the space', async () => {
      await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate Cherry',
            quantity: 2,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );

      await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Pepino',
            quantity: 5,
            unit: 'PIECES',
            harvestedAt: '2026-06-02T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );

      const res = await gql(
        ctx.app,
        HARVESTS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestsFindByCriteria.items).toHaveLength(2);
      expect(res.body.data.harvestsFindByCriteria.total).toBe(2);
    });

    it('returns only harvests from the active space', async () => {
      await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate',
            quantity: 1,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );

      const res = await gql(
        ctx.app,
        HARVESTS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestsFindByCriteria.items).toHaveLength(0);
      expect(res.body.data.harvestsFindByCriteria.total).toBe(0);
    });
  });

  // ─── harvestUpdate mutation ──────────────────────────────────────────────────

  describe('mutation harvestUpdate', () => {
    it('updates a harvest and returns success', async () => {
      const createRes = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate',
            quantity: 1,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );
      const harvestId = createRes.body.data.harvestCreate.id as string;

      const res = await gql(
        ctx.app,
        HARVEST_UPDATE_MUTATION,
        { input: { id: harvestId, cropType: 'Tomate Cherry', quantity: 3.5 } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestUpdate.success).toBe(true);
    });
  });

  // ─── harvestDelete mutation ──────────────────────────────────────────────────

  describe('mutation harvestDelete', () => {
    it('deletes a harvest and returns success', async () => {
      const createRes = await gql(
        ctx.app,
        HARVEST_CREATE_MUTATION,
        {
          input: {
            cropType: 'Tomate',
            quantity: 1,
            unit: 'KG',
            harvestedAt: '2026-06-01T00:00:00.000Z',
          },
        },
        userA.token,
        userA.spaceId,
      );
      const harvestId = createRes.body.data.harvestCreate.id as string;

      const res = await gql(
        ctx.app,
        HARVEST_DELETE_MUTATION,
        { input: { id: harvestId } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.harvestDelete.success).toBe(true);
    });

    it('returns error when harvest is not found', async () => {
      const res = await gql(
        ctx.app,
        HARVEST_DELETE_MUTATION,
        { input: { id: 'f47ac10b-58cc-4372-a567-000000000099' } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });
});
