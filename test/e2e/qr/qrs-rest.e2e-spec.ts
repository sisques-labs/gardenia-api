import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'qr-owner@example.com';
const QR_BASE_URL =
  process.env.QR_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(ctx: E2EContext): Promise<AuthSeed> {
  const regRes = await ctx
    .http()
    .post('/api/auth/register')
    .send({ email: EMAIL, password: PASSWORD })
    .expect(201);

  const { spaceId } = regRes.body as { spaceId: string };

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email: EMAIL, password: PASSWORD })
    .expect(200);

  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId };
}

describe('QR REST API (e2e)', () => {
  let ctx: E2EContext;
  let auth: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    auth = await seedAuth(ctx);
  });

  async function createPlantWithQr(): Promise<{
    plantId: string;
    qrId: string;
    targetUrl: string;
  }> {
    const createRes = await ctx
      .http()
      .post('/api/plants')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('X-Space-ID', auth.spaceId)
      .send({ name: 'QR Plant' })
      .expect(201);

    const body = createRes.body as { id: string; qrId: string };

    expect(body.qrId).toBeDefined();

    const qrRes = await ctx
      .http()
      .get(`/api/qrs/${body.qrId}`)
      .set('Authorization', `Bearer ${auth.token}`)
      .set('X-Space-ID', auth.spaceId)
      .expect(200);

    const { targetUrl } = qrRes.body as { targetUrl: string };

    expect(targetUrl).toBe(
      `${QR_BASE_URL}/plants/${body.id}?spaceId=${auth.spaceId}`,
    );

    return {
      plantId: body.id,
      qrId: body.qrId,
      targetUrl,
    };
  }

  describe('POST /api/plants (QR auto-create via plants)', () => {
    it('201 — plant response includes qrId', async () => {
      await createPlantWithQr();
    });
  });

  describe('GET /api/qrs/:id', () => {
    it('200 — returns QR metadata without plant reference', async () => {
      const { qrId, targetUrl } = await createPlantWithQr();

      const res = await ctx
        .http()
        .get(`/api/qrs/${qrId}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .expect(200);

      expect(res.body).toMatchObject({
        id: qrId,
        spaceId: auth.spaceId,
        targetUrl,
        generation: 1,
      });
      expect(res.body.plantId).toBeUndefined();
    });
  });

  describe('GET /api/qrs/:id/image', () => {
    it('200 — returns PNG bytes', async () => {
      const { qrId } = await createPlantWithQr();

      const res = await ctx
        .http()
        .get(`/api/qrs/${qrId}/image`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .buffer(true)
        .parse((res, callback) => {
          res.setEncoding('binary');
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            callback(null, Buffer.from(data, 'binary'));
          });
        })
        .expect(200)
        .expect('Content-Type', /image\/png/);

      const buffer = res.body as Buffer;
      expect(buffer.subarray(0, 4).toString('hex')).toBe('89504e47');
    });
  });

  describe('POST /api/qrs/:id/regenerate', () => {
    it('204 — increments generation', async () => {
      const { qrId } = await createPlantWithQr();

      await ctx
        .http()
        .post(`/api/qrs/${qrId}/regenerate`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .expect(204);

      const res = await ctx
        .http()
        .get(`/api/qrs/${qrId}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .expect(200);

      expect(res.body.generation).toBe(2);
    });
  });

  describe('DELETE /api/plants/:id (QR cascade via plants)', () => {
    it('204 — removes linked QR', async () => {
      const { plantId, qrId } = await createPlantWithQr();

      await ctx
        .http()
        .delete(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .expect(204);

      await ctx
        .http()
        .get(`/api/qrs/${qrId}`)
        .set('Authorization', `Bearer ${auth.token}`)
        .set('X-Space-ID', auth.spaceId)
        .expect(404);
    });
  });
});
