import { E2EContext } from './app-bootstrap';

export interface AuthSeed {
  token: string;
  spaceId?: string;
}

export async function registerAndLogin(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await ctx
    .http()
    .post('/api/auth/register')
    .send({ email, password })
    .expect(201);

  const spaceId = (regRes.body as { spaceId?: string }).spaceId;

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId };
}

export async function promoteToAdmin(
  ctx: E2EContext,
  email: string,
): Promise<void> {
  await ctx.dataSource.query(
    `UPDATE accounts SET app_role = 'admin' WHERE email = $1`,
    [email],
  );
}

export async function loginAsAdmin(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const seed = await registerAndLogin(ctx, email, password);
  await promoteToAdmin(ctx, email);

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId: seed.spaceId };
}
