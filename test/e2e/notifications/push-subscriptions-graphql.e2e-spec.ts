import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL = 'push-subscriptions-gql@example.com';

const REGISTER_MUTATION = `
  mutation Register($input: RegisterAccountInput!) {
    register(input: $input)
  }
`;

const LOGIN_MUTATION = `
  mutation Login($input: LoginUserInput!) {
    login(input: $input) {
      accessToken
    }
  }
`;

const REGISTER_PUSH_SUBSCRIPTION_MUTATION = `
  mutation RegisterPushSubscription($input: RegisterPushSubscriptionInput!) {
    registerPushSubscription(input: $input) {
      success
      message
      id
    }
  }
`;

const UNREGISTER_PUSH_SUBSCRIPTION_MUTATION = `
  mutation UnregisterPushSubscription($id: String!) {
    unregisterPushSubscription(id: $id) {
      success
      id
    }
  }
`;

async function loginViaGraphQL(ctx: E2EContext): Promise<string> {
  await gql(ctx.app, REGISTER_MUTATION, {
    input: { email: EMAIL, password: PASSWORD },
  });

  const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
    input: { email: EMAIL, password: PASSWORD },
  });

  return loginRes.body.data.login.accessToken as string;
}

describe('Push Subscriptions GraphQL (e2e)', () => {
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

  it('registers a push subscription without an X-Space-ID header', async () => {
    const token = await loginViaGraphQL(ctx);

    const res = await gql(
      ctx.app,
      REGISTER_PUSH_SUBSCRIPTION_MUTATION,
      {
        input: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/gql-abc123',
          p256dh: 'p256dh-key',
          auth: 'auth-secret',
        },
      },
      token,
    );

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.registerPushSubscription.success).toBe(true);
    expect(res.body.data.registerPushSubscription.id).toEqual(
      expect.any(String),
    );
  });

  it('returns a GraphQL error without authentication', async () => {
    const res = await gql(ctx.app, REGISTER_PUSH_SUBSCRIPTION_MUTATION, {
      input: {
        endpoint: 'https://fcm.googleapis.com/fcm/send/gql-abc123',
        p256dh: 'p256dh-key',
        auth: 'auth-secret',
      },
    });

    expect(res.body.errors).toBeDefined();
  });

  it('unregisters a subscription', async () => {
    const token = await loginViaGraphQL(ctx);

    const registerRes = await gql(
      ctx.app,
      REGISTER_PUSH_SUBSCRIPTION_MUTATION,
      {
        input: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/gql-delete-me',
          p256dh: 'p256dh-key',
          auth: 'auth-secret',
        },
      },
      token,
    );
    const id = registerRes.body.data.registerPushSubscription.id as string;

    const unregisterRes = await gql(
      ctx.app,
      UNREGISTER_PUSH_SUBSCRIPTION_MUTATION,
      { id },
      token,
    );

    expect(unregisterRes.body.errors).toBeUndefined();
    expect(unregisterRes.body.data.unregisterPushSubscription.success).toBe(
      true,
    );

    const rows = await ctx.dataSource.query(
      'SELECT * FROM push_subscriptions WHERE id = $1',
      [id],
    );
    expect(rows).toHaveLength(0);
  });
});
