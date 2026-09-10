import { AddressInfo } from 'net';
import * as http from 'http';
import { generateKeyPairSync, KeyObject, randomUUID, sign } from 'crypto';

import { E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const ISSUER = 'https://account.sisques.test';
const AUDIENCE = 'gardenia-e2e-tenant-resolution';
const KID = 'test-platform-signing-key-tenant-resolution';

function base64url(input: Buffer): string {
  return input.toString('base64url');
}

/** Hand-rolled RS256 JWT — mirrors dual-issuer-platform-token.e2e-spec.ts. */
function signPlatformToken(
  payload: Record<string, unknown>,
  privateKey: KeyObject,
): string {
  const header = { alg: 'RS256', typ: 'JWT', kid: KID };
  const encodedHeader = base64url(Buffer.from(JSON.stringify(header)));
  const encodedPayload = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

/**
 * Confirms `tenant-resolution-policy` compliance end-to-end for the WHOLE
 * `migrate-gardenia-to-sisques-account` change (P1+P2): a platform token's
 * `tenants` claim — even with exactly ONE entry — MUST NEVER be read as a
 * current-space selector. `X-Space-ID` is the only accepted mechanism,
 * whoever issued the token. See `space-tenant-mapping` spec's "Missing
 * header rejected even with a single-tenant token" scenario.
 */
describe('Platform token tenant-resolution-policy compliance (e2e)', () => {
  let ctx: E2EContext;
  let jwksServer: http.Server;
  let privateKey: KeyObject;

  beforeAll(async () => {
    const keyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
    privateKey = keyPair.privateKey;
    const jwk = keyPair.publicKey.export({ format: 'jwk' });

    jwksServer = http.createServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          keys: [{ ...jwk, kid: KID, alg: 'RS256', use: 'sig' }],
        }),
      );
    });
    await new Promise<void>((resolve) => jwksServer.listen(0, resolve));
    const port = (jwksServer.address() as AddressInfo).port;

    // Set BEFORE importing app-bootstrap — see dual-issuer-platform-token
    // e2e spec's comment for why a static top-level import would run too late.
    process.env.SISQUES_ACCOUNT_AUTH_ENABLED = 'true';
    process.env.SISQUES_ACCOUNT_ISSUER = ISSUER;
    process.env.SISQUES_ACCOUNT_AUDIENCE = AUDIENCE;
    process.env.SISQUES_ACCOUNT_JWKS_URL = `http://127.0.0.1:${port}/.well-known/jwks.json`;
    // P2 sync guard disabled — this scenario tests SpaceGuard's own X-Space-ID
    // requirement, unaffected by MembershipProjectionSyncGuard either way.
    process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED = 'false';

    const { createE2EApp } = await import('../../helpers/app-bootstrap');
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
    delete process.env.SISQUES_ACCOUNT_AUTH_ENABLED;
    delete process.env.SISQUES_ACCOUNT_ISSUER;
    delete process.env.SISQUES_ACCOUNT_AUDIENCE;
    delete process.env.SISQUES_ACCOUNT_JWKS_URL;
    delete process.env.SISQUES_SPACE_TENANT_SYNC_ENABLED;
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('rejects a platform token with exactly one tenants entry and no X-Space-ID with 400, never defaulting to that tenant', async () => {
    const platformToken = signPlatformToken(
      {
        sub: 'platform-subject-single-tenant',
        email: 'single-tenant@example.com',
        tenants: [{ tenantId: 'the-only-tenant-id', role: 'owner' }],
        iss: ISSUER,
        aud: AUDIENCE,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      privateKey,
    );

    // Auto-provisions a gardenia account on first use (P1 principal resolver)
    // but carries no X-Space-ID — a space-scoped endpoint MUST reject with
    // 400, never inferring the single `tenants[]` entry as the current space.
    await ctx
      .http()
      .get('/api/plants')
      .set('Authorization', `Bearer ${platformToken}`)
      .expect(400);
  });

  it('rejects with 403 (never 200) when X-Space-ID names a space the user is not a member of, even though the token carries a matching-shaped tenants claim', async () => {
    const platformToken = signPlatformToken(
      {
        sub: 'platform-subject-single-tenant-header-present',
        email: 'single-tenant-header@example.com',
        tenants: [{ tenantId: 'irrelevant-platform-tenant-id', role: 'owner' }],
        iss: ISSUER,
        aud: AUDIENCE,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      privateKey,
    );
    const someOtherSpaceId = randomUUID();

    // The header IS present (policy's first gate passes), but the claim MUST
    // NOT be consulted to satisfy or override the membership check either —
    // the user was just auto-provisioned and owns no space with this id.
    await ctx
      .http()
      .get('/api/plants')
      .set('Authorization', `Bearer ${platformToken}`)
      .set('X-Space-ID', someOtherSpaceId)
      .expect(403);
  });
});
