import { createE2EApp, E2EContext } from './helpers/app-bootstrap';
import { truncateAll } from './helpers/db-reset';
import { gql } from './helpers/graphql-client';

const TEST_EMAIL = 'auth-e2e@example.com';
const TEST_PASSWORD = 'SuperStr0ng!Pass';

describe('Auth (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('REST /api/auth', () => {
    describe('POST /api/auth/register', () => {
      it('returns 201 and creates account row in DB', async () => {
        await ctx
          .http()
          .post('/api/auth/register')
          .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
          .expect(201);

        const rows = await ctx.dataSource.query(
          'SELECT id, email FROM accounts WHERE email = $1',
          [TEST_EMAIL],
        );
        expect(rows).toHaveLength(1);
        expect(rows[0].email).toBe(TEST_EMAIL);
      });

      it('returns 409 when email is already registered', async () => {
        await ctx
          .http()
          .post('/api/auth/register')
          .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
          .expect(201);

        await ctx
          .http()
          .post('/api/auth/register')
          .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
          .expect(409);
      });
    });

    describe('POST /api/auth/login', () => {
      beforeEach(async () => {
        await ctx
          .http()
          .post('/api/auth/register')
          .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
      });

      it('returns 200 and accessToken with valid credentials', async () => {
        const res = await ctx
          .http()
          .post('/api/auth/login')
          .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
          .expect(200);

        expect(res.body).toHaveProperty('accessToken');
        expect(typeof res.body.accessToken).toBe('string');
        expect(res.body.accessToken.length).toBeGreaterThan(0);
      });

      it('returns 401 with wrong password', async () => {
        await ctx
          .http()
          .post('/api/auth/login')
          .send({ email: TEST_EMAIL, password: 'WrongP@ssw0rd!' })
          .expect(401);
      });
    });
  });

  describe('GraphQL auth', () => {
    describe('mutation register', () => {
      it('returns data.register truthy and no errors', async () => {
        const res = await gql(
          ctx.app,
          `mutation Register($input: RegisterAccountInput!) {
            register(input: $input)
          }`,
          { input: { email: TEST_EMAIL, password: TEST_PASSWORD } },
        ).expect(200);

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.register).toBe(true);
      });
    });

    describe('mutation login', () => {
      beforeEach(async () => {
        await gql(
          ctx.app,
          `mutation Register($input: RegisterAccountInput!) {
            register(input: $input)
          }`,
          { input: { email: TEST_EMAIL, password: TEST_PASSWORD } },
        );
      });

      it('returns data.login.accessToken as a non-empty string', async () => {
        const res = await gql(
          ctx.app,
          `mutation Login($input: LoginUserInput!) {
            login(input: $input) {
              accessToken
            }
          }`,
          { input: { email: TEST_EMAIL, password: TEST_PASSWORD } },
        ).expect(200);

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.login.accessToken).toBeTruthy();
        expect(typeof res.body.data.login.accessToken).toBe('string');
      });
    });
  });
});
