import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'files-user-a@example.com';
const EMAIL_B = 'files-user-b@example.com';

const NON_EXISTENT_ID = 'f47ac10b-58cc-4372-a567-000000000099';

// Minimal PNG signature + a few bytes — the validator trusts the declared MIME.
const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

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

function binaryParser(
  res: NodeJS.ReadableStream & { setEncoding: (e: string) => void },
  callback: (err: Error | null, body: Buffer) => void,
): void {
  res.setEncoding('binary');
  let data = '';
  res.on('data', (chunk: string) => {
    data += chunk;
  });
  res.on('end', () => {
    callback(null, Buffer.from(data, 'binary'));
  });
}

describe('Files REST API (e2e)', () => {
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

  function upload(
    auth: AuthSeed,
    filename = 'rose.png',
    contentType = 'image/png',
  ) {
    return ctx
      .http()
      .post('/api/files')
      .set('Authorization', `Bearer ${auth.token}`)
      .set('X-Space-ID', auth.spaceId)
      .attach('file', PNG_BYTES, { filename, contentType });
  }

  describe('POST /api/files', () => {
    it('201 — uploads an image and returns id + url', async () => {
      const res = await upload(userA).expect(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.url).toBe(`/api/files/${res.body.id}/content`);
    });

    it('400 — rejects a non-image file', async () => {
      await upload(userA, 'notes.txt', 'text/plain').expect(400);
    });

    it('401 — rejects unauthenticated upload', async () => {
      await ctx
        .http()
        .post('/api/files')
        .set('X-Space-ID', userA.spaceId)
        .attach('file', PNG_BYTES, {
          filename: 'rose.png',
          contentType: 'image/png',
        })
        .expect(401);
    });
  });

  describe('GET /api/files/:id/content', () => {
    it('200 — returns the original bytes with the stored content-type', async () => {
      const { body } = await upload(userA).expect(201);

      const res = await ctx
        .http()
        .get(`/api/files/${body.id}/content`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .buffer()
        .parse(binaryParser as never)
        .expect(200);

      expect(res.headers['content-type']).toContain('image/png');
      expect(Buffer.compare(res.body as Buffer, PNG_BYTES)).toBe(0);
    });

    it('404 — tenant isolation: another space cannot download the content', async () => {
      const { body } = await upload(userA).expect(201);

      await ctx
        .http()
        .get(`/api/files/${body.id}/content`)
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(404);
    });
  });

  describe('GET /api/files', () => {
    it('200 — lists files and filters by mimeType', async () => {
      await upload(userA, 'a.png', 'image/png').expect(201);
      await upload(userA, 'b.jpg', 'image/jpeg').expect(201);

      const all = await ctx
        .http()
        .get('/api/files')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);
      expect(all.body.total).toBe(2);

      const pngOnly = await ctx
        .http()
        .get('/api/files?mimeType=image/png')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);
      expect(pngOnly.body.items).toHaveLength(1);
      expect(pngOnly.body.items[0].mimeType).toBe('image/png');
    });

    it('200 — returns empty list when the space has no files', async () => {
      const res = await ctx
        .http()
        .get('/api/files')
        .set('Authorization', `Bearer ${userB.token}`)
        .set('X-Space-ID', userB.spaceId)
        .expect(200);
      expect(res.body.items).toHaveLength(0);
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('200 — deletes a file, then its content is gone', async () => {
      const { body } = await upload(userA).expect(201);

      await ctx
        .http()
        .delete(`/api/files/${body.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      await ctx
        .http()
        .get(`/api/files/${body.id}/content`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });

    it('404 — deleting an unknown file returns 404', async () => {
      await ctx
        .http()
        .delete(`/api/files/${NON_EXISTENT_ID}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
