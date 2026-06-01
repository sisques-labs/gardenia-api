import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';

describe('Health GET /api/health (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('returns 200 with status "ok" and a valid timestamp — no auth required', async () => {
    const res = await ctx.http().get('/api/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(!Number.isNaN(Date.parse(res.body.timestamp as string))).toBe(true);
  });

  it('returns 200 when no X-Space-ID header is present', async () => {
    const res = await ctx
      .http()
      .get('/api/health')
      .unset('X-Space-ID')
      .expect(200);

    expect(res.body.status).toBe('ok');
  });
});
