import { createE2EApp, E2EContext } from './helpers/app-bootstrap';
import { truncateAll } from './helpers/db-reset';

describe('App bootstrap (e2e)', () => {
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

  it('app initializes and DataSource is connected', () => {
    expect(ctx.app).toBeDefined();
    expect(ctx.dataSource.isInitialized).toBe(true);
  });

  it('GraphQL endpoint responds to introspection', async () => {
    const res = await ctx.http().post('/graphql').send({
      query: '{ __typename }',
    });

    expect(res.status).toBe(200);
    expect(res.body.data.__typename).toBe('Query');
  });
});
