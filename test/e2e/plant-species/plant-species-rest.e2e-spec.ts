import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'plant-species-user@example.com';

describe('Plant Species REST API (e2e)', () => {
  let ctx: E2EContext;
  let token: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    await ctx
      .http()
      .post('/api/auth/register')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(201);

    const loginRes = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD })
      .expect(200);

    token = (loginRes.body as { accessToken: string }).accessToken;
  });

  it('POST /api/plant-species — 201 creates catalog entry', async () => {
    const res = await ctx
      .http()
      .post('/api/plant-species')
      .set('Authorization', `Bearer ${token}`)
      .send({ scientificName: 'Monstera deliciosa' })
      .expect(201);

    expect(res.body).toMatchObject({ scientificName: 'Monstera deliciosa' });
    expect(res.body.id).toBeDefined();
  });

  it('POST /api/plant-species — 409 on duplicate name (case-insensitive)', async () => {
    await ctx
      .http()
      .post('/api/plant-species')
      .set('Authorization', `Bearer ${token}`)
      .send({ scientificName: 'monstera' })
      .expect(201);

    await ctx
      .http()
      .post('/api/plant-species')
      .set('Authorization', `Bearer ${token}`)
      .send({ scientificName: 'Monstera' })
      .expect(409);
  });

  it('GET /api/plant-species — lists entries without X-Space-ID', async () => {
    await ctx
      .http()
      .post('/api/plant-species')
      .set('Authorization', `Bearer ${token}`)
      .send({ scientificName: 'Basil' })
      .expect(201);

    const res = await ctx
      .http()
      .get('/api/plant-species')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].scientificName).toBe('Basil');
  });
});
