import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'plant-photos-user-a@example.com';
const EMAIL_B = 'plant-photos-user-b@example.com';

const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000099';

// Minimal PNG signature + a few bytes — the validator trusts the declared MIME.
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

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

async function seedPlant(ctx: E2EContext, auth: AuthSeed): Promise<string> {
  const res = await ctx
    .http()
    .post('/api/plants')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .send({ name: 'Monstera' })
    .expect(201);
  return res.body.id as string;
}

describe('Plant Photos REST API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;
  let plantId: string;

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
    plantId = await seedPlant(ctx, userA);
  });

  function upload(
    auth: AuthSeed,
    forPlantId: string,
    filename = 'rose.png',
    contentType = 'image/png',
  ) {
    return ctx
      .http()
      .post('/api/plant-photos')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('X-Space-ID', auth.spaceId)
      .field('plantId', forPlantId)
      .attach('file', PNG_BYTES, { filename, contentType });
  }

  describe('POST /api/plant-photos', () => {
    it('201 — uploads a photo, persists the association, and syncs plant.imageUrl', async () => {
      const res = await upload(userA, plantId).expect(201);

      expect(res.body.plantId).toBe(plantId);
      expect(res.body.id).toBeDefined();
      expect(res.body.fileId).toBeDefined();
      expect(res.body.url).toBeDefined();

      const plantRes = await ctx
        .http()
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(plantRes.body.imageUrl).toBe(res.body.url);
    });

    it('400 — rejects a non-image file (propagated from the files context)', async () => {
      await upload(userA, plantId, 'notes.txt', 'text/plain').expect(400);
    });

    it('401 — rejects unauthenticated upload', async () => {
      await ctx
        .http()
        .post('/api/plant-photos')
        .set('X-Space-ID', userA.spaceId)
        .field('plantId', plantId)
        .attach('file', PNG_BYTES, {
          filename: 'rose.png',
          contentType: 'image/png',
        })
        .expect(401);
    });
  });

  describe('GET /api/plant-photos', () => {
    it('200 — lists photos for a plant, most recent first', async () => {
      await upload(userA, plantId, 'a.png').expect(201);
      await upload(userA, plantId, 'b.png').expect(201);

      const res = await ctx
        .http()
        .get(`/api/plant-photos?plantId=${plantId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.total).toBe(2);
    });

    it('200 — tenant isolation: another space sees no photos', async () => {
      await upload(userA, plantId).expect(201);

      const res = await ctx
        .http()
        .get('/api/plant-photos')
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/plant-photos/:id', () => {
    it('200 — the uploader can delete their photo and plant.imageUrl resyncs', async () => {
      const first = await upload(userA, plantId, 'first.png').expect(201);
      const second = await upload(userA, plantId, 'second.png').expect(201);

      await ctx
        .http()
        .delete(`/api/plant-photos/${second.body.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      const plantRes = await ctx
        .http()
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(plantRes.body.imageUrl).toBe(first.body.url);
    });

    it('403 — a non-uploader cannot delete the photo', async () => {
      const uploaded = await upload(userA, plantId).expect(201);

      await ctx
        .http()
        .delete(`/api/plant-photos/${uploaded.body.id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(403);
    });

    it('404 — deleting an unknown photo returns 404', async () => {
      await ctx
        .http()
        .delete(`/api/plant-photos/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
