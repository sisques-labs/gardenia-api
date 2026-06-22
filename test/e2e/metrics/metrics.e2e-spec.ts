import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';

describe('Metrics GET /api/metrics (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  it('returns 200 Prometheus exposition without auth or X-Space-ID', async () => {
    const res = await ctx
      .http()
      .get('/api/metrics')
      .unset('X-Space-ID')
      .expect(200);

    expect(res.headers['content-type']).toContain('text/plain');
    expect(typeof res.text).toBe('string');
  });

  it('exposes Node/process default metrics', async () => {
    const res = await ctx.http().get('/api/metrics').expect(200);

    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('nodejs_eventloop_lag_seconds');
  });

  it('declares the HTTP and CQRS metric families', async () => {
    const res = await ctx.http().get('/api/metrics').expect(200);

    expect(res.text).toContain('http_requests_total');
    expect(res.text).toContain('http_request_duration_seconds');
    expect(res.text).toContain('cqrs_handler_total');
    expect(res.text).toContain('cqrs_events_published_total');
  });
});
