import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'harvests-user-a@example.com';
const EMAIL_B = 'harvests-user-b@example.com';

const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000099';

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await ctx
    .http()
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);

  const { spaceId } = regRes.body as { spaceId: string };

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId };
}

const VALID_HARVEST = {
  cropType: 'Tomate Cherry',
  quantity: 2.5,
  unit: 'KG',
  harvestedAt: '2026-06-01T00:00:00.000Z',
};

describe('Harvests REST API (e2e)', () => {
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

  // ─── POST /api/harvests ──────────────────────────────────────────────────────

  describe('POST /api/harvests', () => {
    it('201 — creates a harvest and returns it', async () => {
      const res = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      expect(res.body).toMatchObject({
        cropType: 'Tomate Cherry',
        quantity: 2.5,
        unit: 'KG',
        spaceId: userA.spaceId,
      });
      expect(res.body.id).toBeDefined();
    });

    it('201 — stores and returns decimal quantity correctly', async () => {
      const res = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, quantity: 0.125 })
        .expect(201);

      expect(res.body.quantity).toBe(0.125);
    });

    it('400 — rejects empty cropType', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, cropType: '' })
        .expect(400);
    });

    it('400 — rejects quantity of 0', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, quantity: 0 })
        .expect(400);
    });

    it('400 — rejects invalid unit', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, unit: 'POUNDS' })
        .expect(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(401);
    });
  });

  // ─── GET /api/harvests/:id ───────────────────────────────────────────────────

  describe('GET /api/harvests/:id', () => {
    it('200 — returns an existing harvest', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .get(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({ id, cropType: 'Tomate Cherry' });
    });

    it('404 — returns 404 for unknown id', async () => {
      await ctx
        .http()
        .get(`/api/harvests/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });

    it('404 — tenant isolation: harvest from another space returns 404', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .get(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(404);
    });
  });

  // ─── GET /api/harvests ───────────────────────────────────────────────────────

  describe('GET /api/harvests', () => {
    it('200 — returns list of harvests in the space', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, cropType: 'Pepino', quantity: 1 })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('200 — returns empty list when space has no harvests', async () => {
      const res = await ctx
        .http()
        .get('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('200 — returns only harvests from the active space', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/harvests')
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
    });

    it('200 — filters by cropType (case-insensitive)', async () => {
      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_HARVEST, cropType: 'Pepino', quantity: 1 })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/harvests?cropType=tomate')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].cropType).toBe('Tomate Cherry');
    });
  });

  // ─── PATCH /api/harvests/:id ─────────────────────────────────────────────────

  describe('PATCH /api/harvests/:id', () => {
    it('200 — updates a harvest', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .patch(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ cropType: 'Pepino', quantity: 5 })
        .expect(200);

      expect(res.body).toMatchObject({ id, cropType: 'Pepino', quantity: 5 });
    });

    it('403 — user B cannot update a harvest in user A space (SpaceGuard)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .patch(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ cropType: 'Hijacked' })
        .expect(403);
    });

    it('404 — returns 404 for unknown harvest', async () => {
      await ctx
        .http()
        .patch(`/api/harvests/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ cropType: 'Ghost' })
        .expect(404);
    });
  });

  // ─── DELETE /api/harvests/:id ────────────────────────────────────────────────

  describe('DELETE /api/harvests/:id', () => {
    it('200 — deletes a harvest successfully', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .delete(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({ success: true });

      await ctx
        .http()
        .get(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });

    it('403 — user B cannot delete a harvest in user A space (SpaceGuard)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/harvests')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_HARVEST)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/harvests/${id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(403);
    });

    it('404 — returns 404 for unknown harvest', async () => {
      await ctx
        .http()
        .delete(`/api/harvests/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
