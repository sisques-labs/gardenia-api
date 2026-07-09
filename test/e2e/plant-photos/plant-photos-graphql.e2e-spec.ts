import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'plant-photos-gql-a@example.com';
const EMAIL_B = 'plant-photos-gql-b@example.com';

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

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

const PLANT_PHOTO_FIND_BY_ID_QUERY = `
  query PlantPhotoFindById($input: PlantPhotoFindByIdRequestDto!) {
    plantPhotoFindById(input: $input) {
      id
      plantId
      url
      spaceId
    }
  }
`;

const PLANT_PHOTOS_FIND_BY_CRITERIA_QUERY = `
  query PlantPhotosFindByCriteria($input: PlantPhotoFindByCriteriaRequestDto) {
    plantPhotosFindByCriteria(input: $input) {
      items {
        id
        plantId
      }
      total
    }
  }
`;

const PLANT_PHOTO_DELETE_MUTATION = `
  mutation PlantPhotoDelete($input: PlantPhotoDeleteRequestDto!) {
    plantPhotoDelete(input: $input) {
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

async function seedPlant(ctx: E2EContext, auth: AuthSeed): Promise<string> {
  const res = await ctx
    .http()
    .post('/api/plants')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .send({ name: 'Monstera' })
    .expect(201);
  return res.body.id as string;
}

async function seedPhoto(
  ctx: E2EContext,
  auth: AuthSeed,
  plantId: string,
): Promise<{ id: string; url: string }> {
  const res = await ctx
    .http()
    .post('/api/plant-photos')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .field('plantId', plantId)
    .attach('file', PNG_BYTES, {
      filename: 'rose.png',
      contentType: 'image/png',
    })
    .expect(201);
  return { id: res.body.id as string, url: res.body.url as string };
}

describe('Plant Photos GraphQL API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;
  let plantId: string;

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
    plantId = await seedPlant(ctx, userA);
  });

  describe('query plantPhotoFindById', () => {
    it('returns the photo when found in the space', async () => {
      const photo = await seedPhoto(ctx, userA, plantId);

      const res = await gql(
        ctx.app,
        PLANT_PHOTO_FIND_BY_ID_QUERY,
        { input: { id: photo.id } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantPhotoFindById).toMatchObject({
        id: photo.id,
        plantId,
        spaceId: userA.spaceId,
      });
    });

    it('returns error when the photo belongs to a different space', async () => {
      const photo = await seedPhoto(ctx, userA, plantId);

      const res = await gql(
        ctx.app,
        PLANT_PHOTO_FIND_BY_ID_QUERY,
        { input: { id: photo.id } },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });

  describe('query plantPhotosFindByCriteria', () => {
    it('returns all photos in the space', async () => {
      await seedPhoto(ctx, userA, plantId);
      await seedPhoto(ctx, userA, plantId);

      const res = await gql(
        ctx.app,
        PLANT_PHOTOS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantPhotosFindByCriteria.total).toBe(2);
    });

    it('returns only photos from the active space', async () => {
      await seedPhoto(ctx, userA, plantId);

      const res = await gql(
        ctx.app,
        PLANT_PHOTOS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantPhotosFindByCriteria.total).toBe(0);
    });
  });

  describe('mutation plantPhotoDelete', () => {
    it('deletes a photo uploaded by the requesting user', async () => {
      const photo = await seedPhoto(ctx, userA, plantId);

      const res = await gql(
        ctx.app,
        PLANT_PHOTO_DELETE_MUTATION,
        { input: { id: photo.id } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantPhotoDelete.success).toBe(true);
    });

    it('returns error when the photo is not found', async () => {
      const res = await gql(
        ctx.app,
        PLANT_PHOTO_DELETE_MUTATION,
        { input: { id: 'f47ac10b-58cc-4372-a567-000000000099' } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });
});
