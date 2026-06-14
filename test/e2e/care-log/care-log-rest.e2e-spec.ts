import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { CareLogActivityTypeEnum } from '../../../src/contexts/care-log/domain/enums/care-log-activity-type.enum';
import { CareLogUnitEnum } from '../../../src/contexts/care-log/domain/enums/care-log-unit.enum';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'care-log-owner@example.com';
const EMAIL_B = 'care-log-other@example.com';

const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000000';

const PAST_DATE = '2024-01-15T10:00:00.000Z';

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

async function seedPlant(ctx: E2EContext, owner: AuthSeed): Promise<string> {
  const res = await ctx
    .http()
    .post('/api/plants')
    .set('Authorization', `Bearer ${owner.token}`)
    .set('X-Space-ID', owner.spaceId)
    .send({ name: 'Test Plant' })
    .expect(201);

  return (res.body as { id: string }).id;
}

describe('Care Log REST API (e2e)', () => {
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

  // ─── POST /api/care-log ──────────────────────────────────────────────────────

  describe('POST /api/care-log', () => {
    it('201 — creates entry with required fields (activityType, plantId)', async () => {
      const plantId = await seedPlant(ctx, owner);

      const res = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.plantId).toBe(plantId);
      expect(res.body.activityType).toBe(CareLogActivityTypeEnum.WATERING);
    });

    it('201 — creates entry with optional notes, quantity, and unit', async () => {
      const plantId = await seedPlant(ctx, owner);

      const res = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({
          plantId,
          activityType: CareLogActivityTypeEnum.FERTILIZING,
          performedAt: PAST_DATE,
          notes: 'Used liquid fertilizer',
          quantity: 250,
          unit: CareLogUnitEnum.ML,
        })
        .expect(201);

      expect(res.body.notes).toBe('Used liquid fertilizer');
      expect(Number(res.body.quantity)).toBe(250);
      expect(res.body.unit).toBe(CareLogUnitEnum.ML);
    });

    it('422 — rejects quantity without unit (domain mismatch)', async () => {
      const plantId = await seedPlant(ctx, owner);

      await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({
          plantId,
          activityType: CareLogActivityTypeEnum.WATERING,
          quantity: 100,
        })
        .expect(422);
    });

    it('401 — rejects unauthenticated request', async () => {
      const plantId = await seedPlant(ctx, owner);

      await ctx
        .http()
        .post('/api/care-log')
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(401);
    });
  });

  // ─── GET /api/care-log/plant/:plantId ───────────────────────────────────────

  describe('GET /api/care-log/plant/:plantId', () => {
    it('200 — returns entries for that plant', async () => {
      const plantId = await seedPlant(ctx, owner);

      await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      const res = await ctx
        .http()
        .get(`/api/care-log/plant/${plantId}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].plantId).toBe(plantId);
    });

    it('200 — tenant isolation: no cross-space entries returned', async () => {
      const ownerPlantId = await seedPlant(ctx, owner);

      await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId: ownerPlantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      // Other user queries for the same plantId but in their own space — should see nothing
      const res = await ctx
        .http()
        .get(`/api/care-log/plant/${ownerPlantId}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', other.spaceId)
        .expect(200);

      expect(res.body).toHaveLength(0);
    });
  });

  // ─── GET /api/care-log ───────────────────────────────────────────────────────

  describe('GET /api/care-log', () => {
    it('200 — returns entries for the space', async () => {
      const plantId = await seedPlant(ctx, owner);

      await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.PRUNING })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── GET /api/care-log/:id ───────────────────────────────────────────────────

  describe('GET /api/care-log/:id', () => {
    it('200 — returns entry by id', async () => {
      const plantId = await seedPlant(ctx, owner);

      const createRes = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.MISTING })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .get(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(200);

      expect(res.body.id).toBe(id);
    });

    it('404 — unknown id', async () => {
      await ctx
        .http()
        .get(`/api/care-log/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });
  });

  // ─── PATCH /api/care-log/:id ─────────────────────────────────────────────────

  describe('PATCH /api/care-log/:id', () => {
    it('200 — owner updates the entry', async () => {
      const plantId = await seedPlant(ctx, owner);

      const createRes = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .patch(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ notes: 'Updated notes' })
        .expect(200);

      expect(res.body.notes).toBe('Updated notes');
    });

    it('403 — non-owner with owner spaceId is blocked by SpaceGuard', async () => {
      // SpaceGuard rejects requests where the JWT user is not a member of the given space.
      // other user uses owner.spaceId → SpaceGuard returns 403 before ownership is checked.
      const plantId = await seedPlant(ctx, owner);

      const createRes = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .patch(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ notes: 'Hijacked' })
        .expect(403);
    });

    it('404 — unknown id', async () => {
      await ctx
        .http()
        .patch(`/api/care-log/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ notes: 'Ghost' })
        .expect(404);
    });
  });

  // ─── DELETE /api/care-log/:id ────────────────────────────────────────────────

  describe('DELETE /api/care-log/:id', () => {
    it('204 — owner deletes the entry', async () => {
      const plantId = await seedPlant(ctx, owner);

      const createRes = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(204);

      await ctx
        .http()
        .get(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });

    it('403 — non-owner with owner spaceId is blocked by SpaceGuard', async () => {
      // SpaceGuard rejects requests where the JWT user is not a member of the given space.
      // other user uses owner.spaceId → SpaceGuard returns 403 before ownership is checked.
      const plantId = await seedPlant(ctx, owner);

      const createRes = await ctx
        .http()
        .post('/api/care-log')
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .send({ plantId, activityType: CareLogActivityTypeEnum.WATERING })
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/care-log/${id}`)
        .set('Authorization', `Bearer ${other.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(403);
    });

    it('404 — unknown id', async () => {
      await ctx
        .http()
        .delete(`/api/care-log/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${owner.token}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(404);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .delete(`/api/care-log/${NON_EXISTENT_ID}`)
        .set('X-Space-ID', owner.spaceId)
        .expect(401);
    });
  });
});
