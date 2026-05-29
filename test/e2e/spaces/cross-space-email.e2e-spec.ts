import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const SHARED_EMAIL = 'same@example.com';
const PASSWORD = 'SuperStr0ng!Pass';

describe('Cross-Space Email Uniqueness (e2e)', () => {
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

  describe('7.4 — Duplicate email across Spaces → OK', () => {
    it('allows the same email to register twice (each gets its own Space)', async () => {
      // First registration → creates Space A
      const resA = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: SHARED_EMAIL, password: PASSWORD })
        .expect(201);

      // Second registration with the same email → creates Space B
      const resB = await ctx
        .http()
        .post('/api/auth/register')
        .send({ email: SHARED_EMAIL, password: PASSWORD })
        .expect(201);

      // Both must return distinct spaceIds
      expect(resA.body.spaceId).toBeDefined();
      expect(resB.body.spaceId).toBeDefined();
      expect(resA.body.spaceId).not.toBe(resB.body.spaceId);

      // Two account rows must exist in DB for the same email
      const rows = await ctx.dataSource.query(
        'SELECT id, email, space_id FROM accounts WHERE email = $1',
        [SHARED_EMAIL],
      );
      expect(rows).toHaveLength(2);
    });
  });

  // 7.5 — Duplicate email within the SAME Space → not testable via the public
  // registration endpoint. Each call to POST /api/auth/register creates a NEW
  // Space, so two registrations with the same email always land in different
  // Spaces. The uniqueness constraint (space_id, email) is enforced at the DB
  // level (migration 0.4) and verified by the unit tests in
  // AssertAccountEmailAvailableService. No E2E scenario is feasible here
  // without an "invite user to existing space" flow (out of scope for this PR).
});
