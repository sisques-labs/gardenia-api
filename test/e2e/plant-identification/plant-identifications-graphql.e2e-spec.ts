import { PLANTNET_IDENTIFICATION_PORT } from '../../../src/contexts/plant-identification/application/ports/plantnet-identification.port';
import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';
import { gql } from '../../helpers/graphql-client';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'plant-identification-gql-a@example.com';
const EMAIL_B = 'plant-identification-gql-b@example.com';

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

const PLANT_IDENTIFICATIONS_FIND_BY_CRITERIA_QUERY = `
  query PlantIdentificationsFindByCriteria($input: PlantIdentificationFindByCriteriaRequestDto) {
    plantIdentificationsFindByCriteria(input: $input) {
      items {
        id
        status
      }
      total
    }
  }
`;

const CREATE_PLANT_FROM_IDENTIFICATION_MUTATION = `
  mutation CreatePlantFromIdentification($input: CreatePlantFromIdentificationRequestDto!) {
    createPlantFromIdentification(input: $input) {
      id
    }
  }
`;

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(ctx: E2EContext, email: string): Promise<AuthSeed> {
  const regRes = await gql(ctx.app, REGISTER_MUTATION, {
    input: { email, password: PASSWORD },
  });
  const spaceId = regRes.body.data.register as string;

  const loginRes = await gql(ctx.app, LOGIN_MUTATION, {
    input: { email, password: PASSWORD },
  });
  const token = loginRes.body.data.login.accessToken as string;

  return { token, spaceId };
}

async function seedIdentification(
  ctx: E2EContext,
  auth: AuthSeed,
): Promise<{ id: string }> {
  const res = await ctx
    .http()
    .post('/api/plant-identifications')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .field('organs', '["leaf"]')
    .attach('photos', PNG_BYTES, {
      filename: 'leaf.png',
      contentType: 'image/png',
    })
    .expect(201);

  return { id: res.body.id as string };
}

class FakePlantNetIdentificationPort {
  static behavior: 'resolved' | 'no_match' = 'resolved';

  async identify() {
    if (FakePlantNetIdentificationPort.behavior === 'no_match') {
      return [
        {
          scientificName: 'Unrecognizable plantus',
          commonNames: [],
          score: 0.05,
        },
      ];
    }
    return [
      {
        scientificName: 'Monstera deliciosa',
        commonNames: ['Swiss cheese plant'],
        score: 0.9,
      },
    ];
  }
}

describe('Plant Identification GraphQL API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;
  let userB: AuthSeed;

  beforeAll(async () => {
    ctx = await createE2EApp([
      {
        provide: PLANTNET_IDENTIFICATION_PORT,
        useClass: FakePlantNetIdentificationPort,
      },
    ]);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    FakePlantNetIdentificationPort.behavior = 'resolved';
    await truncateAll(ctx.dataSource);
    userA = await seedAuth(ctx, EMAIL_A);
    userB = await seedAuth(ctx, EMAIL_B);
  });

  describe('query plantIdentificationsFindByCriteria', () => {
    it('returns identification history for the active space', async () => {
      await seedIdentification(ctx, userA);

      const res = await gql(
        ctx.app,
        PLANT_IDENTIFICATIONS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantIdentificationsFindByCriteria.total).toBe(1);
    });

    it('returns only identifications from the active space', async () => {
      await seedIdentification(ctx, userA);

      const res = await gql(
        ctx.app,
        PLANT_IDENTIFICATIONS_FIND_BY_CRITERIA_QUERY,
        { input: {} },
        userB.token,
        userB.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.plantIdentificationsFindByCriteria.total).toBe(0);
    });
  });

  describe('mutation createPlantFromIdentification', () => {
    it('creates a linked plant and the plant appears via plants query', async () => {
      const identification = await seedIdentification(ctx, userA);

      const res = await gql(
        ctx.app,
        CREATE_PLANT_FROM_IDENTIFICATION_MUTATION,
        {
          input: {
            identificationId: identification.id,
            name: 'My Monstera',
          },
        },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeUndefined();
      const plantId = res.body.data.createPlantFromIdentification.id as string;
      expect(plantId).toBeDefined();

      const plantRes = await ctx
        .http()
        .get(`/api/plants/${plantId}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(plantRes.body.name).toBe('My Monstera');
    });

    it('409 — rejects conversion of an unresolved identification', async () => {
      FakePlantNetIdentificationPort.behavior = 'no_match';
      const identification = await seedIdentification(ctx, userA);

      const res = await gql(
        ctx.app,
        CREATE_PLANT_FROM_IDENTIFICATION_MUTATION,
        { input: { identificationId: identification.id, name: 'Mystery' } },
        userA.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });

    it("403 — a non-owner cannot convert someone else's identification", async () => {
      const identification = await seedIdentification(ctx, userA);

      const res = await gql(
        ctx.app,
        CREATE_PLANT_FROM_IDENTIFICATION_MUTATION,
        {
          input: { identificationId: identification.id, name: 'Not mine' },
        },
        userB.token,
        userA.spaceId,
      ).expect(200);

      expect(res.body.errors).toBeDefined();
    });
  });
});
