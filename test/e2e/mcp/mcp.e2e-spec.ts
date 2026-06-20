import * as request from 'supertest';

import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'mcp-user@example.com';

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

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
}

function mcpCall(
  ctx: E2EContext,
  auth: AuthSeed | null,
  payload: Record<string, unknown>,
): request.Test {
  let req = ctx
    .http()
    .post('/api/mcp')
    .set('Accept', 'application/json, text/event-stream')
    .set('Content-Type', 'application/json');
  if (auth) {
    req = req.set('Authorization', `Bearer ${auth.token}`);
    req = req.set('X-Space-ID', auth.spaceId);
  }
  return req.send(payload);
}

describe('MCP transport (e2e)', () => {
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

  // ─── Auth / tenancy ────────────────────────────────────────────────────────

  it('401 — rejects requests without a JWT', async () => {
    await mcpCall(ctx, null, {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    }).expect(401);
  });

  it('400 — rejects authenticated requests without X-Space-ID', async () => {
    await ctx
      .http()
      .post('/api/mcp')
      .set('Accept', 'application/json, text/event-stream')
      .set('Authorization', `Bearer ${auth.token}`)
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
      .expect(400);
  });

  // ─── Handshake & discovery ───────────────────────────────────────────────────

  it('initialize — advertises the gardenia-api server', async () => {
    const res = await mcpCall(ctx, auth, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'e2e', version: '1.0.0' },
      },
    }).expect(200);

    const body = res.body as JsonRpcResponse;
    expect(body.result?.serverInfo).toMatchObject({ name: 'gardenia-api' });
  });

  it('tools/list — exposes tools from multiple contexts', async () => {
    const res = await mcpCall(ctx, auth, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }).expect(200);

    const body = res.body as JsonRpcResponse;
    const tools = (body.result?.tools ?? []) as { name: string }[];
    const names = tools.map((t) => t.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'plant_create',
        'care_log_create',
        'inventory_item_create',
        'space_create',
        'weather_get_forecast',
      ]),
    );
    // The auth context must NOT be exposed.
    expect(names.some((n) => n.startsWith('account_'))).toBe(false);
  });

  // ─── Tool execution ──────────────────────────────────────────────────────────

  it('tools/call — creates a plant via the bus within the active space', async () => {
    const res = await mcpCall(ctx, auth, {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: { name: 'plant_create', arguments: { name: 'MCP Fern' } },
    }).expect(200);

    const body = res.body as JsonRpcResponse;
    const content = (body.result?.content ?? []) as { text: string }[];
    const payload = JSON.parse(content[0].text) as {
      success: boolean;
      id: string;
    };
    expect(payload.success).toBe(true);
    expect(payload.id).toEqual(expect.any(String));

    // The plant is readable back through another tool in the same space.
    const findRes = await mcpCall(ctx, auth, {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: { name: 'plant_find_by_id', arguments: { id: payload.id } },
    }).expect(200);

    const findBody = findRes.body as JsonRpcResponse;
    const findContent = (findBody.result?.content ?? []) as { text: string }[];
    const found = JSON.parse(findContent[0].text) as { name: string } | null;
    expect(found).not.toBeNull();
    expect(found?.name).toBe('MCP Fern');
  });
});
