import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import {
  loginAsAdmin,
  promoteToAdmin,
  registerAndLogin,
} from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const USER_EMAIL = 'plant-species-user@example.com';
const ADMIN_EMAIL = 'plant-species-admin@example.com';

describe('Plant Species REST API (e2e)', () => {
  let ctx: E2EContext;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    const user = await registerAndLogin(ctx, USER_EMAIL, PASSWORD);
    userToken = user.token;

    const admin = await loginAsAdmin(ctx, ADMIN_EMAIL, PASSWORD);
    adminToken = admin.token;
  });

  describe('write endpoints — admin authorization', () => {
    it('POST /api/plant-species — 403 for non-admin user', async () => {
      await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ scientificName: 'Monstera deliciosa' })
        .expect(403);
    });

    it('POST /api/plant-species — 201 creates catalog entry for admin', async () => {
      const res = await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'Monstera deliciosa' })
        .expect(201);

      expect(res.body).toMatchObject({ scientificName: 'Monstera deliciosa' });
      expect(res.body.id).toBeDefined();
    });

    it('POST /api/plant-species — 409 on duplicate name (case-insensitive) for admin', async () => {
      await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'monstera' })
        .expect(201);

      await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'Monstera' })
        .expect(409);
    });

    it('PATCH /api/plant-species/:id — 403 for non-admin user', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'Basil' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .patch(`/api/plant-species/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Updated' })
        .expect(403);
    });

    it('DELETE /api/plant-species/:id — 403 for non-admin user', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'Thyme' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/plant-species/${id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('read endpoints — any authenticated user', () => {
    it('GET /api/plant-species — lists entries without X-Space-ID', async () => {
      await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ scientificName: 'Basil' })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/plant-species')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].scientificName).toBe('Basil');
    });
  });

  describe('promoted admin — fresh login required', () => {
    it('403 with stale user token after DB promotion without re-login', async () => {
      await promoteToAdmin(ctx, USER_EMAIL);

      await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ scientificName: 'Stale Token Species' })
        .expect(403);
    });
  });
});
