import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'guard-a@example.com';
const EMAIL_B = 'guard-b@example.com';

describe('SpaceGuard enforcement (e2e)', () => {
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

  describe('7.2 — Missing X-Space-ID header → 400', () => {
    it('returns 400 when no X-Space-ID is provided on a guarded endpoint', async () => {
      // Register and login to get a valid JWT
      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: EMAIL_A, password: PASSWORD })
        .expect(201);

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: EMAIL_A, password: PASSWORD })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      // Make a guarded request WITHOUT X-Space-ID
      await ctx
        .http()
        .get('/api/plants')
        .set('Authorization', `Bearer ${accessToken}`)
        // intentionally no X-Space-ID
        .expect(400);
    });
  });

  describe('7.3 — Non-member X-Space-ID → 403', () => {
    it('returns 403 when user provides a valid spaceId they are not a member of', async () => {
      // Register User A → Space A
      const regA = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: EMAIL_A, password: PASSWORD })
        .expect(201);
      const { spaceId: spaceIdA } = regA.body as { spaceId: string };

      // Register User B → Space B (different space)
      const regB = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: EMAIL_B, password: PASSWORD })
        .expect(201);
      const { spaceId: spaceIdB } = regB.body as { spaceId: string };

      // Login as User A
      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: EMAIL_A, password: PASSWORD })
        .expect(200);
      const { accessToken: tokenA } = loginRes.body as { accessToken: string };

      // User A attempts to use Space B's ID — they are NOT a member of Space B
      await ctx
        .http()
        .get('/api/plants')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Space-ID', spaceIdB)
        .expect(403);

      // Sanity check: User A can access Space A just fine
      await ctx
        .http()
        .get('/api/plants')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('X-Space-ID', spaceIdA)
        .expect(200);
    });
  });
});
