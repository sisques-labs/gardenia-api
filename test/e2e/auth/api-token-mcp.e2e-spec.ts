import * as request from 'supertest';

import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'api-token-user@example.com';

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

/** Registers + logs in, then issues an API token scoped to the user's space. */
async function seedTokens(
  ctx: E2EContext,
): Promise<{ jwt: string; spaceId: string; apiToken: string }> {
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

  const issueRes = await ctx
    .http()
    .post('/api/auth/api-tokens')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('X-Space-ID', spaceId)
    .send({ label: 'Home Assistant' })
    .expect(201);
  const { token } = issueRes.body as { id: string; token: string };

  return { jwt: accessToken, spaceId, apiToken: token };
}

/** MCP JSON-RPC call authenticated with an API token and NO X-Space-ID. */
function mcpWithApiToken(
  ctx: E2EContext,
  apiToken: string,
  payload: Record<string, unknown>,
): request.Test {
  return ctx
    .http()
    .post('/api/mcp')
    .set('Accept', 'application/json, text/event-stream')
    .set('Content-Type', 'application/json')
    .set('Authorization', `Bearer ${apiToken}`)
    .send(payload);
}

describe('API token → MCP (e2e)', () => {
  let ctx: E2EContext;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('issuance returns the plaintext token exactly once (prefixed)', async () => {
    const { apiToken } = await seedTokens(ctx);
    expect(apiToken).toMatch(/^ght_/);
  });

  it('authenticates /api/mcp with no X-Space-ID and lists tools', async () => {
    const { apiToken } = await seedTokens(ctx);

    const res = await mcpWithApiToken(ctx, apiToken, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }).expect(200);

    const body = res.body as JsonRpcResponse;
    const names = ((body.result?.tools ?? []) as { name: string }[]).map(
      (t) => t.name,
    );
    expect(names).toEqual(expect.arrayContaining(['plant_create']));
  });

  it('runs a tool within the token-scoped space', async () => {
    const { apiToken } = await seedTokens(ctx);

    const res = await mcpWithApiToken(ctx, apiToken, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'plant_create', arguments: { name: 'Token Fern' } },
    }).expect(200);

    const body = res.body as JsonRpcResponse;
    const content = (body.result?.content ?? []) as { text: string }[];
    const payload = JSON.parse(content[0].text) as {
      success: boolean;
      id: string;
    };
    expect(payload.success).toBe(true);
    expect(payload.id).toEqual(expect.any(String));
  });

  it('rejects a malformed API token with 401', async () => {
    await mcpWithApiToken(ctx, 'ght_not-a-real-token', {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {},
    }).expect(401);
  });

  it('rejects a revoked API token with 401', async () => {
    const { jwt, apiToken } = await seedTokens(ctx);

    const listRes = await ctx
      .http()
      .get('/api/auth/api-tokens')
      .set('Authorization', `Bearer ${jwt}`)
      .expect(200);
    const [{ id }] = listRes.body as { id: string }[];

    await ctx
      .http()
      .delete(`/api/auth/api-tokens/${id}`)
      .set('Authorization', `Bearer ${jwt}`)
      .expect(204);

    await mcpWithApiToken(ctx, apiToken, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
      params: {},
    }).expect(401);
  });
});
