import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'planting-spots-owner@example.com';
const EMAIL_B = 'planting-spots-other@example.com';

// Valid UUID that will never exist in the DB
const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000001';

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

describe('PlantingSpots REST API (e2e)', () => {
  let ctx: E2EContext;
  let owner: AuthSeed;
  let other: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    owner = await seedAuth(ctx, EMAIL_A, PASSWORD);
    other = await seedAuth(ctx, EMAIL_B, PASSWORD);
  });

  // ─── POST /api/planting-spots ────────────────────────────────────────────────

  describe('POST /api/planting-spots', () => {
    it('201 — creates a planting spot with required fields (SC-01)', async () => {
      const res = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Bancal Norte', type: 'raised_bed' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Bancal Norte',
        type: 'raised_bed',
        spaceId: owner.spaceId,
      });
      expect(res.body.id).toBeDefined();
    });

    it('201 — creates a planting spot with optional description', async () => {
      const res = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Pot Corner', type: 'pot', description: 'South wall' })
        .expect(201);

      expect(res.body.description).toBe('South wall');
    });

    it('400 — rejects invalid type (SC-02)', async () => {
      await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'X', type: 'greenhouse' })
        .expect(400);
    });

    it('400 — rejects missing name', async () => {
      await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ type: 'pot' })
        .expect(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .post('/api/planting-spots')
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Ghost', type: 'pot' })
        .expect(401);
    });
  });

  // ─── GET /api/planting-spots/:id ─────────────────────────────────────────────

  describe('GET /api/planting-spots/:id', () => {
    it('200 — returns an existing planting spot (SC-10)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Bancal Este', type: 'raised_bed' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .get(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({ id, name: 'Bancal Este' });
    });

    it('404 — returns 404 for unknown id', async () => {
      await ctx
        .http()
        .get(`/api/planting-spots/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });

    it('404 — tenant isolation: spot from another space returns 404 (SC-11)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Owner Spot', type: 'pot' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      // Other user queries with their own spaceId — should not see owner's spot
      await ctx
        .http()
        .get(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', other.spaceId)
        .expect(404);
    });
  });

  // ─── GET /api/planting-spots ─────────────────────────────────────────────────

  describe('GET /api/planting-spots', () => {
    it('200 — returns list of spots in the space', async () => {
      await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Spot 1', type: 'raised_bed' })
        .expect(201);

      await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Spot 2', type: 'pot' })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('200 — returns empty list when space has no spots (SC-14)', async () => {
      const res = await ctx
        .http()
        .get('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('200 — returns only spots from the active space (SC-12)', async () => {
      // Owner creates a spot in their space
      await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Owner Spot', type: 'raised_bed' })
        .expect(201);

      // Other user lists their own space — should see no spots
      const res = await ctx
        .http()
        .get('/api/planting-spots')
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', other.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
    });
  });

  // ─── PATCH /api/planting-spots/:id ───────────────────────────────────────────

  describe('PATCH /api/planting-spots/:id', () => {
    it('200 — owner can update name and description (SC-04)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Old Name', type: 'pot' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .patch(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'New Name', description: 'Updated desc' })
        .expect(200);

      expect(res.body).toMatchObject({
        id,
        name: 'New Name',
        description: 'Updated desc',
      });
    });

    it('403 — non-member cannot update a spot in another user space (SC-05)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Protected Spot', type: 'pot' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      // Other user tries to update using owner's space ID — SpaceGuard blocks (403)
      await ctx
        .http()
        .patch(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Hijacked' })
        .expect(403);
    });

    it('404 — returns 404 for unknown spot', async () => {
      await ctx
        .http()
        .patch(`/api/planting-spots/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  // ─── DELETE /api/planting-spots/:id ──────────────────────────────────────────

  describe('DELETE /api/planting-spots/:id', () => {
    it('204 — owner can delete their spot (SC-07)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Doomed Spot', type: 'container' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(204);

      // Confirm it's gone
      await ctx
        .http()
        .get(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });

    it('403 — non-member cannot delete a spot in another user space (SC-09)', async () => {
      const createRes = await ctx
        .http()
        .post('/api/planting-spots')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Protected Spot', type: 'pot' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/planting-spots/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(403);
    });

    it('404 — returns 404 for unknown spot', async () => {
      await ctx
        .http()
        .delete(`/api/planting-spots/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });
  });
});
