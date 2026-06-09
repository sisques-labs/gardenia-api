import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_OWNER = 'invite-owner@example.com';
const EMAIL_GUEST = 'invite-guest@example.com';

describe('Space invitations (e2e)', () => {
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

  it('owner creates invitation and guest accepts via code', async () => {
    const regOwner = await ctx
      .http()
      .post('/api/auth/register')
      .send({ email: EMAIL_OWNER, password: PASSWORD })
      .expect(201);
    const { spaceId } = regOwner.body as { spaceId: string };

    const loginOwner = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: EMAIL_OWNER, password: PASSWORD })
      .expect(200);
    const { accessToken: ownerToken } = loginOwner.body as {
      accessToken: string;
    };

    const inviteRes = await ctx
      .http()
      .post(`/api/spaces/${spaceId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Space-ID', spaceId)
      .send({ role: 'member' })
      .expect(201);

    const { code, displayCode } = inviteRes.body as {
      code: string;
      displayCode: string;
    };
    expect(code).toBeTruthy();
    expect(displayCode).toContain('·');

    await ctx
      .http()
      .post('/api/auth/register')
      .send({ email: EMAIL_GUEST, password: PASSWORD })
      .expect(201);

    const loginGuest = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: EMAIL_GUEST, password: PASSWORD })
      .expect(200);
    const { accessToken: guestToken } = loginGuest.body as {
      accessToken: string;
    };

    const acceptRes = await ctx
      .http()
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ code: displayCode })
      .expect(200);

    expect(acceptRes.body).toMatchObject({
      userId: expect.any(String),
      spaceId,
    });

    const spacesRes = await ctx
      .http()
      .get('/api/spaces/me')
      .set('Authorization', `Bearer ${guestToken}`)
      .expect(200);

    const { items } = spacesRes.body as { items: { id: string }[] };
    expect(items.some((s) => s.id === spaceId)).toBe(true);

    const acceptAgainRes = await ctx
      .http()
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ code: displayCode })
      .expect(200);

    expect(acceptAgainRes.body).toMatchObject({ spaceId });
  });

  it('returns 410 when invitation is expired', async () => {
    const regOwner = await ctx
      .http()
      .post('/api/auth/register')
      .send({ email: 'expired-owner@example.com', password: PASSWORD })
      .expect(201);
    const { spaceId } = regOwner.body as { spaceId: string };

    const loginOwner = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: 'expired-owner@example.com', password: PASSWORD })
      .expect(200);
    const { accessToken: ownerToken } = loginOwner.body as {
      accessToken: string;
    };

    const inviteRes = await ctx
      .http()
      .post(`/api/spaces/${spaceId}/invitations`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('X-Space-ID', spaceId)
      .send({})
      .expect(201);

    const { code } = inviteRes.body as { code: string };

    await ctx.dataSource.query(
      `UPDATE space_invitations SET expires_at = NOW() - INTERVAL '1 hour' WHERE code = $1`,
      [code],
    );

    await ctx
      .http()
      .post('/api/auth/register')
      .send({ email: 'expired-guest@example.com', password: PASSWORD })
      .expect(201);

    const loginGuest = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email: 'expired-guest@example.com', password: PASSWORD })
      .expect(200);
    const { accessToken: guestToken } = loginGuest.body as {
      accessToken: string;
    };

    await ctx
      .http()
      .post('/api/invitations/accept')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ code })
      .expect(410);
  });
});
