import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const TEST_EMAIL = 'delete-account-e2e@example.com';
const TEST_PASSWORD = 'SuperStr0ng!Pass';

describe('Auth DELETE /api/auth/account (e2e)', () => {
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

  describe('happy path', () => {
    it('returns 204 when authenticated user deletes their account', async () => {
      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      await ctx
        .http()
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('login fails after account deletion', async () => {
      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      await ctx
        .http()
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(401);
    });

    it('returns 204 without X-Space-ID header', async () => {
      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      await ctx
        .http()
        .delete('/api/auth/account')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });
  });

  describe('unauthenticated', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      await ctx.http().delete('/api/auth/account').expect(401);
    });
  });
});
