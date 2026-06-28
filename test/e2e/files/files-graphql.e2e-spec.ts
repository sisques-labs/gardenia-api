import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'files-gql-a@example.com';

const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

const FILE_FIND_BY_ID_QUERY = `
  query FileFindById($input: FileFindByIdRequestDto!) {
    fileFindById(input: $input) {
      id
      filename
      mimeType
      size
      url
    }
  }
`;

const FILES_FIND_BY_CRITERIA_QUERY = `
  query FilesFindByCriteria($input: FileFindByCriteriaRequestDto) {
    filesFindByCriteria(input: $input) {
      items {
        id
        filename
        mimeType
      }
      total
    }
  }
`;

const FILE_DELETE_MUTATION = `
  mutation FileDelete($input: FileDeleteRequestDto!) {
    fileDelete(input: $input) {
      success
      id
    }
  }
`;

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(
  ctx: E2EContext,
  email: string,
  password: string,
): Promise<AuthSeed> {
  const regRes = await gql(ctx.app, REGISTER_MUTATION, {
    input: { email, password },
  });
  const spaceId = regRes.body.data.register as string;

  const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
    input: { email, password },
  });
  const token = loginRes.body.data.login.accessToken as string;

  return { token, spaceId };
}

async function uploadFile(ctx: E2EContext, auth: AuthSeed): Promise<string> {
  const res = await ctx
    .http()
    .post('/api/files')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .attach('file', PNG_BYTES, {
      filename: 'rose.png',
      contentType: 'image/png',
    })
    .expect(201);
  return res.body.id as string;
}

describe('Files GraphQL API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    userA = await seedAuth(ctx, EMAIL_A, PASSWORD);
  });

  it('query fileFindById returns the uploaded file metadata', async () => {
    const id = await uploadFile(ctx, userA);

    const res = await gql(
      ctx.app,
      FILE_FIND_BY_ID_QUERY,
      { input: { id } },
      userA.token,
      userA.spaceId,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.fileFindById).toMatchObject({
      id,
      filename: 'rose.png',
      mimeType: 'image/png',
    });
  });

  it('query filesFindByCriteria lists the space files', async () => {
    await uploadFile(ctx, userA);

    const res = await gql(
      ctx.app,
      FILES_FIND_BY_CRITERIA_QUERY,
      { input: {} },
      userA.token,
      userA.spaceId,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.filesFindByCriteria.total).toBe(1);
  });

  it('mutation fileDelete removes the file', async () => {
    const id = await uploadFile(ctx, userA);

    const res = await gql(
      ctx.app,
      FILE_DELETE_MUTATION,
      { input: { id } },
      userA.token,
      userA.spaceId,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.fileDelete.success).toBe(true);

    const findRes = await gql(
      ctx.app,
      FILE_FIND_BY_ID_QUERY,
      { input: { id } },
      userA.token,
      userA.spaceId,
    ).expect(200);
    expect(findRes.body.data.fileFindById).toBeNull();
  });

  it('mutation fileDelete requires authentication', async () => {
    const res = await gql(ctx.app, FILE_DELETE_MUTATION, {
      input: { id: '00000000-0000-0000-0000-000000000000' },
    }).expect(200);

    expect(res.body.errors).toBeDefined();
  });
});
