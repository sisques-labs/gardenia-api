import { createE2EApp, E2EContext } from './helpers/app-bootstrap';
import { truncateAll } from './helpers/db-reset';
import { gql } from './helpers/graphql-client';

const REGISTER_EMAIL = 'users-e2e@example.com';
const REGISTER_PASSWORD = 'SuperStr0ng!Pass';

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

describe('Users (e2e)', () => {
  let ctx: E2EContext;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
    await truncateAll(ctx.dataSource);

    // Register a user so we have data to query
    await gql(ctx.app, REGISTER_MUTATION, {
      input: { email: REGISTER_EMAIL, password: REGISTER_PASSWORD },
    });

    // Login to obtain JWT
    const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
      input: { email: REGISTER_EMAIL, password: REGISTER_PASSWORD },
    });
    token = loginRes.body.data.login.accessToken;

    // Fetch the created user id via findByCriteria
    const listRes = await gql(
      ctx.app,
      `query {
        usersFindByCriteria {
          items {
            id
            status
            username
          }
        }
      }`,
      {},
      token,
    );
    userId = listRes.body.data.usersFindByCriteria.items[0].id;
  });

  afterAll(async () => {
    await ctx.close();
  });

  describe('query usersFindByCriteria', () => {
    it('returns items array with at least one user', async () => {
      const res = await gql(
        ctx.app,
        `query {
          usersFindByCriteria {
            items {
              id
              status
              username
            }
          }
        }`,
        {},
        token,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.usersFindByCriteria.items).toBeDefined();
      expect(res.body.data.usersFindByCriteria.items.length).toBeGreaterThan(0);
    });
  });

  describe('query userFindById', () => {
    it('returns the correct user when id exists', async () => {
      const res = await gql(
        ctx.app,
        `query UserFindById($input: UserFindByIdRequestDto!) {
          userFindById(input: $input) {
            id
            username
            status
          }
        }`,
        { input: { id: userId } },
        token,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.userFindById.id).toBe(userId);
    });

    it('returns null (no errors array) for non-existent id', async () => {
      const res = await gql(
        ctx.app,
        `query UserFindById($input: UserFindByIdRequestDto!) {
          userFindById(input: $input) {
            id
          }
        }`,
        { input: { id: '00000000-0000-0000-0000-000000000000' } },
        token,
      ).expect(200);

      // userFindById is nullable — non-existent returns null, no GQL error
      expect(res.body.data.userFindById).toBeNull();
    });
  });

  describe('mutation userUpdate', () => {
    it('returns success true and updates the user', async () => {
      const res = await gql(
        ctx.app,
        `mutation UserUpdate($input: UserUpdateRequestDto!) {
          userUpdate(input: $input) {
            success
            message
          }
        }`,
        { input: { id: userId, username: 'updateduser' } },
        token,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.userUpdate.success).toBe(true);

      // Verify the change persisted in DB
      const rows = await ctx.dataSource.query(
        'SELECT username FROM users WHERE id = $1',
        [userId],
      );
      expect(rows[0].username).toBe('updateduser');
    });
  });

  describe('mutation userDelete', () => {
    it('returns success true and user no longer appears in queries', async () => {
      const res = await gql(
        ctx.app,
        `mutation UserDelete($input: UserDeleteRequestDto!) {
          userDelete(input: $input) {
            success
            message
          }
        }`,
        { input: { id: userId } },
        token,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.userDelete.success).toBe(true);

      // User should no longer appear in list query
      const listRes = await gql(
        ctx.app,
        `query {
          usersFindByCriteria {
            items { id }
          }
        }`,
        {},
        token,
      );
      const ids = listRes.body.data.usersFindByCriteria.items.map(
        (u: { id: string }) => u.id,
      );
      expect(ids).not.toContain(userId);
    });
  });
});
