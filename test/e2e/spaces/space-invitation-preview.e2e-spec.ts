import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_OWNER = 'preview-owner@example.com';

const SPACE_INVITATION_PREVIEW = `
  query SpaceInvitationPreview($code: String!) {
    spaceInvitationPreview(code: $code) {
      spaceName
      role
      expiresAt
      isExpired
    }
  }
`;

const SPACE_ACCEPT_INVITATION = `
  mutation SpaceAcceptInvitation($input: SpaceAcceptInvitationRequestDto!) {
    spaceAcceptInvitation(input: $input) {
      success
      message
      id
    }
  }
`;

describe('Space invitation preview (e2e)', () => {
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

  async function createInvitation(email: string) {
    const reg = await ctx
      .http()
      .post('/api/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const { spaceId } = reg.body as { spaceId: string };

    const login = await ctx
      .http()
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    const { accessToken: ownerToken } = login.body as { accessToken: string };

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

    return { spaceId, code, displayCode, ownerToken };
  }

  describe('REST GET /api/invitations/:code', () => {
    it('returns the preview without an Authorization header', async () => {
      const { code } = await createInvitation('preview-rest-owner@example.com');

      const res = await ctx.http().get(`/api/invitations/${code}`).expect(200);

      expect(res.body).toMatchObject({
        spaceName: expect.any(String),
        role: 'member',
        isExpired: false,
      });
    });

    it('returns 200 with isExpired: true for an expired invitation', async () => {
      const { code } = await createInvitation(
        'preview-rest-expired@example.com',
      );

      await ctx.dataSource.query(
        `UPDATE space_invitations SET expires_at = NOW() - INTERVAL '1 hour' WHERE code = $1`,
        [code],
      );

      const res = await ctx.http().get(`/api/invitations/${code}`).expect(200);

      expect(res.body.isExpired).toBe(true);
    });

    it('returns 404 for an unknown code', async () => {
      await ctx.http().get('/api/invitations/DOESNOTEXIST').expect(404);
    });
  });

  describe('GraphQL spaceInvitationPreview', () => {
    it('returns the preview without an Authorization header', async () => {
      const { code } = await createInvitation(EMAIL_OWNER);

      const res = await gql(ctx.app, SPACE_INVITATION_PREVIEW, { code }).expect(
        200,
      );

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.spaceInvitationPreview).toMatchObject({
        role: 'MEMBER',
        isExpired: false,
      });
    });
  });

  describe('GraphQL structured error codes', () => {
    it('spaceAcceptInvitation with an unknown code returns extensions.code InvitationNotFoundException', async () => {
      const reg = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: 'preview-err-guest@example.com', password: PASSWORD })
        .expect(201);
      void reg;

      const login = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: 'preview-err-guest@example.com', password: PASSWORD })
        .expect(200);
      const { accessToken: guestToken } = login.body as {
        accessToken: string;
      };

      const res = await gql(
        ctx.app,
        SPACE_ACCEPT_INVITATION,
        { input: { code: 'DOESNOTEXIST' } },
        guestToken,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe(
        'InvitationNotFoundException',
      );
    });

    it('spaceAcceptInvitation with an expired code returns extensions.code InvitationExpiredException', async () => {
      const { code } = await createInvitation('preview-err-owner@example.com');

      await ctx.dataSource.query(
        `UPDATE space_invitations SET expires_at = NOW() - INTERVAL '1 hour' WHERE code = $1`,
        [code],
      );

      await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: 'preview-err-guest2@example.com', password: PASSWORD })
        .expect(201);

      const login = await ctx
        .http()
        .post('/api/auth/login')
        .send({ email: 'preview-err-guest2@example.com', password: PASSWORD })
        .expect(200);
      const { accessToken: guestToken } = login.body as {
        accessToken: string;
      };

      const res = await gql(
        ctx.app,
        SPACE_ACCEPT_INVITATION,
        { input: { code } },
        guestToken,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].extensions?.code).toBe(
        'InvitationExpiredException',
      );
    });
  });
});
