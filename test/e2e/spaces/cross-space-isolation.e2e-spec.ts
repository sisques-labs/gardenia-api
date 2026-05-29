import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'space-a@example.com';
const EMAIL_B = 'space-b@example.com';

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

const USERS_FIND_BY_CRITERIA = `
  query {
    usersFindByCriteria {
      items {
        id
        status
        username
      }
    }
  }
`;

describe('Cross-Space Data Isolation (e2e)', () => {
  let ctx: E2EContext;

  let spaceIdA: string;
  let tokenA: string;
  let userIdFromA: string;

  let spaceIdB: string;
  let tokenB: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
    await truncateAll(ctx.dataSource);

    // Register User A → Space A created
    const regA = await gql(ctx.app, REGISTER_MUTATION, {
      input: { email: EMAIL_A, password: PASSWORD },
    });
    spaceIdA = regA.body.data.register as string;

    // Login User A
    const loginA = await gql(ctx.app, LOGIN_MUTATION, {
      input: { email: EMAIL_A, password: PASSWORD },
    });
    tokenA = loginA.body.data.login.accessToken as string;

    // Register User B → Space B created
    const regB = await gql(ctx.app, REGISTER_MUTATION, {
      input: { email: EMAIL_B, password: PASSWORD },
    });
    spaceIdB = regB.body.data.register as string;

    // Login User B
    const loginB = await gql(ctx.app, LOGIN_MUTATION, {
      input: { email: EMAIL_B, password: PASSWORD },
    });
    tokenB = loginB.body.data.login.accessToken as string;

    // Capture userIdFromA from Space A's user list
    const listA = await gql(
      ctx.app,
      USERS_FIND_BY_CRITERIA,
      {},
      tokenA,
      spaceIdA,
    );
    userIdFromA = listA.body.data.usersFindByCriteria.items[0].id as string;
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('7.1a — Space A query returns at least one user', async () => {
    const res = await gql(
      ctx.app,
      USERS_FIND_BY_CRITERIA,
      {},
      tokenA,
      spaceIdA,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.usersFindByCriteria.items.length).toBeGreaterThan(0);
  });

  it('7.1b — Space B query returns at least one user', async () => {
    const res = await gql(
      ctx.app,
      USERS_FIND_BY_CRITERIA,
      {},
      tokenB,
      spaceIdB,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.usersFindByCriteria.items.length).toBeGreaterThan(0);
  });

  it('7.1c — Space A userId is NOT visible in Space B results', async () => {
    const res = await gql(
      ctx.app,
      USERS_FIND_BY_CRITERIA,
      {},
      tokenB,
      spaceIdB,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    const ids = (
      res.body.data.usersFindByCriteria.items as Array<{ id: string }>
    ).map((u) => u.id);
    expect(ids).not.toContain(userIdFromA);
  });
});
