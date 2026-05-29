import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const TEST_EMAIL = 'get-me-e2e@example.com';
const TEST_PASSWORD = 'SuperStr0ng!Pass';

describe('Auth GET /api/auth/me (e2e)', () => {
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
    it('returns 200 with account fields and no passwordHash', async () => {
      const registerRes = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(201);

      const { spaceId } = registerRes.body as { spaceId: string };

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      const res = await ctx
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Space-ID', spaceId)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('email', TEST_EMAIL);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');
      expect(res.body).not.toHaveProperty('passwordHash');
    });
  });

  describe('unauthenticated', () => {
    it('returns 401 when no Authorization header is provided', async () => {
      await ctx.http().get('/api/auth/me').expect(401);
    });
  });
});
