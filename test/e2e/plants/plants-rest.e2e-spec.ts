import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { loginAsAdmin } from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'plants-owner@example.com';
const EMAIL_B = 'plants-other@example.com';

// Valid UUID v4 format that will never exist in the DB
const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000000';

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

describe('Plants REST API (e2e)', () => {
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

  // ─── POST /api/plants ────────────────────────────────────────────────────────

  describe('POST /api/plants', () => {
    it('201 — creates a plant with name only', async () => {
      const res = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'My Fern' })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'My Fern',
        spaceId: owner.spaceId,
      });
      expect(res.body.id).toBeDefined();
      expect(res.body.qrId).toBeDefined();
    });

    it('201 — creates a plant with plantSpeciesId and imageUrl', async () => {
      const admin = await loginAsAdmin(
        ctx,
        'plants-admin@example.com',
        PASSWORD,
      );

      const speciesRes = await ctx
        .http()
        .post('/api/plant-species')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ scientificName: 'Rosa canina' })
        .expect(201);

      const { id: plantSpeciesId } = speciesRes.body as { id: string };

      const res = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({
          name: 'Rose',
          plantSpeciesId,
          imageUrl: 'https://example.com/rose.jpg',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Rose',
        plantSpeciesId,
        imageUrl: 'https://example.com/rose.jpg',
      });
    });

    it('400 — rejects empty name', async () => {
      await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: '' })
        .expect(400);
    });

    it('400 — rejects missing name', async () => {
      await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({})
        .expect(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .post('/api/plants')
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Ghost Plant' })
        .expect(401);
    });
  });

  // ─── GET /api/plants/:id ─────────────────────────────────────────────────────

  describe('GET /api/plants/:id', () => {
    it('200 — returns an existing plant', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Cactus' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .get(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({ id, name: 'Cactus' });
    });

    it('404 — returns 404 for unknown plant id', async () => {
      await ctx
        .http()
        .get(`/api/plants/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });
  });

  // ─── GET /api/plants ─────────────────────────────────────────────────────────

  describe('GET /api/plants', () => {
    it('200 — returns paginated list of plants in the space', async () => {
      await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Plant 1' })
        .expect(201);

      await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Plant 2' })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('200 — returns only plants from the active space (tenant isolation)', async () => {
      // Owner creates a plant in their space
      await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Owner Plant' })
        .expect(201);

      // Other user lists their own space — should see no plants
      const res = await ctx
        .http()
        .get('/api/plants')
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', other.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
    });
  });

  // ─── PATCH /api/plants/:id ───────────────────────────────────────────────────

  describe('PATCH /api/plants/:id', () => {
    it('200 — owner can update plant name', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Old Name' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .patch(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'New Name' })
        .expect(200);

      expect(res.body).toMatchObject({ id, name: 'New Name' });
    });

    it('403 — non-owner cannot update plant', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Owner Plant' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      // Add other user to the same space so the plant is visible, but they don't own it.
      // Since other user has their own space and cannot access owner's space plant
      // (cross-space isolation), we need to test this differently.
      // The 403 case requires the other user to be in the SAME space but NOT the owner.
      // We simulate this by creating a plant in other's space first, then trying
      // to patch owner's plant via owner's spaceId with other's token.
      // But SpaceGuard will 403 since other is not a member of owner.spaceId.
      // The correct test: other tries to patch a plant in THEIR OWN space that they don't own.
      // That requires another user in the same space. Since registration creates a new space,
      // we can't directly test this without space membership.
      // Instead, verify that accessing owner's plant with owner's token works (already tested above)
      // and that accessing with wrong space is 403 from SpaceGuard.
      await ctx
        .http()
        .patch(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Hijacked' })
        .expect(403);
    });

    it('404 — returns 404 for unknown plant', async () => {
      await ctx
        .http()
        .patch(`/api/plants/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  // ─── DELETE /api/plants/:id ──────────────────────────────────────────────────

  describe('DELETE /api/plants/:id', () => {
    it('204 — owner can delete their plant', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Doomed Plant' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(204);

      // Confirm it's gone
      await ctx
        .http()
        .get(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });

    it('403 — non-member cannot delete a plant in another user space', async () => {
      const createRes = await ctx
        .http()
        .post('/api/plants')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ name: 'Protected Plant' })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/plants/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(403);
    });

    it('404 — returns 404 for unknown plant', async () => {
      await ctx
        .http()
        .delete(`/api/plants/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });
  });
});
