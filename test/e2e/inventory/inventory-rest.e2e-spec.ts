import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'inventory-user-a@example.com';
const EMAIL_B = 'inventory-user-b@example.com';

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

const VALID_ITEM = {
  itemType: 'SEEDS',
  name: 'Lettuce seeds',
  quantity: 5,
  unit: 'PACKETS',
};

describe('Inventory REST API (e2e)', () => {
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

  describe('POST /api/inventory-items', () => {
    it('201 — creates an item and returns it', async () => {
      const res = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      expect(res.body).toMatchObject({
        itemType: 'SEEDS',
        name: 'Lettuce seeds',
        quantity: 5,
        unit: 'PACKETS',
        spaceId: userA.spaceId,
      });
      expect(res.body.id).toBeDefined();
    });

    it('400 — rejects empty name', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_ITEM, name: '' })
        .expect(400);
    });

    it('400 — rejects negative quantity', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_ITEM, quantity: -1 })
        .expect(400);
    });

    it('400 — rejects the removed POT item type', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_ITEM, itemType: 'POT' })
        .expect(400);
    });

    it('401 — rejects unauthenticated request', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(401);
    });
  });

  describe('GET /api/inventory-items/:id', () => {
    it('200 — returns an existing item', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .get(`/api/inventory-items/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({ id, name: 'Lettuce seeds' });
    });

    it('404 — tenant isolation: item from another space returns 404', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .get(`/api/inventory-items/${id}`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(404);
    });
  });

  describe('GET /api/inventory-items', () => {
    it('200 — filters by itemType', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({
          itemType: 'FERTILIZER',
          name: 'Tomato fertilizer',
          quantity: 2,
          unit: 'L',
        })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/inventory-items?itemType=SEEDS')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].itemType).toBe('SEEDS');
    });

    it('200 — filters by lowStock', async () => {
      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({
          ...VALID_ITEM,
          name: 'Low item',
          quantity: 1,
          lowStockThreshold: 3,
        })
        .expect(201);

      await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({
          ...VALID_ITEM,
          name: 'Plenty item',
          quantity: 10,
          lowStockThreshold: 3,
        })
        .expect(201);

      const res = await ctx
        .http()
        .get('/api/inventory-items?lowStock=true')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].name).toBe('Low item');
    });

    it('200 — returns empty list when space has no items', async () => {
      const res = await ctx
        .http()
        .get('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.items).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  describe('POST /api/inventory-items/:id/adjust', () => {
    it('200 — consumes stock', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_ITEM, quantity: 10 })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .post(`/api/inventory-items/${id}/adjust`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ delta: -3, reason: 'sowed lettuce' })
        .expect(200);

      expect(res.body.quantity).toBe(7);
    });

    it('200 — clamps to zero on over-consumption', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ ...VALID_ITEM, quantity: 2 })
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .post(`/api/inventory-items/${id}/adjust`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ delta: -5, reason: 'used all' })
        .expect(200);

      expect(res.body.quantity).toBe(0);
    });

    it('400 — rejects missing reason', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .post(`/api/inventory-items/${id}/adjust`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ delta: -1, reason: '' })
        .expect(400);
    });
  });

  describe('PATCH /api/inventory-items/:id', () => {
    it('200 — updates an item', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      const { id } = createRes.body as { id: string };

      const res = await ctx
        .http()
        .patch(`/api/inventory-items/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ name: 'Tomato seeds' })
        .expect(200);

      expect(res.body).toMatchObject({ id, name: 'Tomato seeds' });
    });

    it('404 — returns 404 for unknown item', async () => {
      await ctx
        .http()
        .patch(`/api/inventory-items/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send({ name: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /api/inventory-items/:id', () => {
    it('200 — deletes an item', async () => {
      const createRes = await ctx
        .http()
        .post('/api/inventory-items')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .send(VALID_ITEM)
        .expect(201);

      const { id } = createRes.body as { id: string };

      await ctx
        .http()
        .delete(`/api/inventory-items/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      await ctx
        .http()
        .get(`/api/inventory-items/${id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });

    it('404 — returns 404 for unknown item', async () => {
      await ctx
        .http()
        .delete(`/api/inventory-items/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
