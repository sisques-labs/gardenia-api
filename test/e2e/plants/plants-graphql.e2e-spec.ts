import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { registerAndLogin } from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const USER_EMAIL = 'plants-gql-user@example.com';

const PLANT_CREATE = `
  mutation PlantCreate($input: PlantCreateRequestDto!) {
    plantCreate(input: $input) {
      success
      id
    }
  }
`;

const PLANTS_FIND_BY_CRITERIA = `
  query PlantsFindByCriteria($input: PlantFindByCriteriaRequestDto) {
    plantsFindByCriteria(input: $input) {
      items { id name }
      total
    }
  }
`;

describe('Plants GraphQL find-by-criteria filters (e2e)', () => {
  let ctx: E2EContext;
  let token: string;
  let spaceId: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    const seed = await registerAndLogin(ctx, USER_EMAIL, PASSWORD);
    token = seed.token;
    spaceId = seed.spaceId!;

    for (const name of ['Rose', 'Rosemary', 'Fern']) {
      await gql(
        ctx.app,
        PLANT_CREATE,
        { input: { name } },
        token,
        spaceId,
      ).expect(200);
    }
  });

  it('applies a LIKE filter on name', async () => {
    const res = await gql(
      ctx.app,
      PLANTS_FIND_BY_CRITERIA,
      {
        input: {
          filters: [{ field: 'NAME', operator: 'LIKE', value: 'Rose' }],
        },
      },
      token,
      spaceId,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.plantsFindByCriteria.total).toBe(2);
    expect(
      res.body.data.plantsFindByCriteria.items
        .map((p: { name: string }) => p.name)
        .sort(),
    ).toEqual(['Rose', 'Rosemary']);
  });

  it('rejects a filter field outside PlantQueryableFieldEnum at the schema level', async () => {
    const res = await gql(
      ctx.app,
      PLANTS_FIND_BY_CRITERIA,
      {
        input: {
          filters: [{ field: 'USER_ID', operator: 'EQUALS', value: 'x' }],
        },
      },
      token,
      spaceId,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.data).toBeUndefined();
  });

  it('rejects a value that does not match the field registry', async () => {
    const res = await gql(
      ctx.app,
      PLANTS_FIND_BY_CRITERIA,
      {
        input: {
          filters: [{ field: 'NAME', operator: 'EQUALS', value: 42 }],
        },
      },
      token,
      spaceId,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toMatch(/Invalid value/);
  });

  it('sorts by name ascending', async () => {
    const res = await gql(
      ctx.app,
      PLANTS_FIND_BY_CRITERIA,
      {
        input: { sorts: [{ field: 'NAME', direction: 'ASC' }] },
      },
      token,
      spaceId,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(
      res.body.data.plantsFindByCriteria.items.map(
        (p: { name: string }) => p.name,
      ),
    ).toEqual(['Fern', 'Rose', 'Rosemary']);
  });
});
