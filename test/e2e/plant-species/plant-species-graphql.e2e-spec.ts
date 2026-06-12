import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { loginAsAdmin, registerAndLogin } from '../../helpers/auth-seed';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const USER_EMAIL = 'plant-species-gql-user@example.com';
const ADMIN_EMAIL = 'plant-species-gql-admin@example.com';

const CREATE_PLANT_SPECIES = `
  mutation CreatePlantSpecies($input: PlantSpeciesCreateRequestDto!) {
    createPlantSpecies(input: $input) {
      success
      message
      id
    }
  }
`;

describe('Plant Species GraphQL mutations (e2e)', () => {
  let ctx: E2EContext;
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ctx = await createE2EApp();
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);

    const user = await registerAndLogin(ctx, USER_EMAIL, PASSWORD);
    userToken = user.token;

    const admin = await loginAsAdmin(ctx, ADMIN_EMAIL, PASSWORD);
    adminToken = admin.token;
  });

  it('createPlantSpecies — FORBIDDEN for non-admin user', async () => {
    const res = await gql(
      ctx.app,
      CREATE_PLANT_SPECIES,
      { input: { scientificName: 'Rosa canina' } },
      userToken,
    ).expect(200);

    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBe('Insufficient app role');
    expect(res.body.errors[0].extensions?.code).toBe('FORBIDDEN');
    expect(res.body.data?.createPlantSpecies).toBeFalsy();
  });

  it('createPlantSpecies — succeeds for admin', async () => {
    const res = await gql(
      ctx.app,
      CREATE_PLANT_SPECIES,
      { input: { scientificName: 'Rosa canina' } },
      adminToken,
    ).expect(200);

    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.createPlantSpecies).toMatchObject({
      success: true,
      message: 'Plant species created successfully',
    });
    expect(res.body.data.createPlantSpecies.id).toBeDefined();
  });
});
