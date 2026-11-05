import { AddressInfo } from 'net';
import * as http from 'http';
import { generateKeyPairSync, KeyObject, sign } from 'crypto';

import { E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const ISSUER = 'https://account.sisques.test';
const AUDIENCE = 'gardenia-e2e-test';
const KID = 'test-platform-signing-key-1';

function base64url(input: Buffer): string {
  return input.toString('base64url');
}

/** Hand-rolled RS256 JWT — avoids adding a `jsonwebtoken` dependency just for tests. */
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

describe('Dual-issuer platform token authentication (e2e)', () => {
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

    // Set BEFORE importing app-bootstrap: JwtAuthGuard/SisquesAccountJwtStrategy
    // read these from process.env / ConfigService at module load / DI
    // construction time, so a static top-level import would run too late.
    process.env.SISQUES_ACCOUNT_AUTH_ENABLED = 'true';
    process.env.SISQUES_ACCOUNT_ISSUER = ISSUER;
    process.env.SISQUES_ACCOUNT_AUDIENCE = AUDIENCE;
    process.env.SISQUES_ACCOUNT_JWKS_URL = `http://127.0.0.1:${port}/.well-known/jwks.json`;

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
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  describe('a verified platform token with no matching local account', () => {
    it('authenticates GET /api/auth/me and auto-provisions a new account', async () => {
      const platformToken = signPlatformToken(
        {
          sub: 'platform-subject-new-user',
          email: 'platform-new@example.com',
          platformAdmin: true,
          tenants: [{ tenantId: 'some-tenant-id', role: 'owner' }],
          iss: ISSUER,
          aud: AUDIENCE,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        privateKey,
      );

      const res = await ctx
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${platformToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', 'platform-new@example.com');
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('creates no gardenia auth session for the platform-authenticated request (no local re-minting)', async () => {
      const before = (await ctx.dataSource.query(
        'SELECT COUNT(*) AS count FROM "auth_sessions"',
      )) as Array<{ count: string }>;

      const platformToken = signPlatformToken(
        {
          sub: 'platform-subject-no-reminting',
          email: 'platform-no-reminting@example.com',
          iss: ISSUER,
          aud: AUDIENCE,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        privateKey,
      );

      await ctx
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${platformToken}`)
        .expect(200);

      const after = (await ctx.dataSource.query(
        'SELECT COUNT(*) AS count FROM "auth_sessions"',
      )) as Array<{ count: string }>;

      expect(after[0].count).toBe(before[0].count);
    });
  });

  describe('a platform token reused for the same subject', () => {
    it('resolves the same account without re-linking or re-provisioning', async () => {
      const payload = {
        sub: 'platform-subject-repeat',
        email: 'platform-repeat@example.com',
        iss: ISSUER,
        aud: AUDIENCE,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const firstRes = await ctx
        .http()
        .get('/api/auth/me')
        .set(
          'Authorization',
          `Bearer ${signPlatformToken(payload, privateKey)}`,
        )
        .expect(200);

      const secondRes = await ctx
        .http()
        .get('/api/auth/me')
        .set(
          'Authorization',
          `Bearer ${signPlatformToken(payload, privateKey)}`,
        )
        .expect(200);

      expect(secondRes.body).toHaveProperty(
        'userId',
        (firstRes.body as { userId: string }).userId,
      );
    });
  });

  describe('native gardenia login is unaffected by dual-issuer acceptance', () => {
    it('still authenticates with a native password-issued JWT', async () => {
      const email = 'native-user-dual-issuer@example.com';
      const password = 'SuperStr0ng!Pass';

      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      const loginRes = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const { accessToken } = loginRes.body as { accessToken: string };

      const res = await ctx
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('email', email);
    });
  });

  describe('an invalid platform token', () => {
    it('is rejected with 401 when the signature does not match the published JWKS', async () => {
      const otherKeyPair = generateKeyPairSync('rsa', { modulusLength: 2048 });
      const forgedToken = signPlatformToken(
        {
          sub: 'platform-subject-forged',
          email: 'forged@example.com',
          iss: ISSUER,
          aud: AUDIENCE,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
        otherKeyPair.privateKey,
      );

      await ctx
        .http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forgedToken}`)
        .expect(401);
    });
  });
});
