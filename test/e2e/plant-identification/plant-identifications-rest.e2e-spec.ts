import { PLANTNET_IDENTIFICATION_PORT } from '../../../src/contexts/plant-identification/application/ports/plantnet-identification.port';
import { PlantIdentificationOrganEnum } from '../../../src/contexts/plant-identification/domain/enums/plant-identification-organ.enum';
import { createE2EApp, E2EContext } from '../../helpers/app-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const PASSWORD = 'SuperStr0ng!Pass';
const EMAIL_A = 'plant-identification-user-a@example.com';

const PNG_BYTES = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x01, 0x02, 0x03,
]);

interface AuthSeed {
  token: string;
  spaceId: string;
}

async function seedAuth(ctx: E2EContext, email: string): Promise<AuthSeed> {
  const regRes = await ctx
    .http()
    .post('/api/auth/register')
    .send({ email, password: PASSWORD })
    .expect(201);
  const { spaceId } = regRes.body as { spaceId: string };

  const loginRes = await ctx
    .http()
    .post('/api/auth/login')
    .send({ email, password: PASSWORD })
    .expect(200);
  const { accessToken } = loginRes.body as { accessToken: string };

  return { token: accessToken, spaceId };
}

function identify(
  ctx: E2EContext,
  auth: AuthSeed,
  organs = '["leaf"]',
  photoCount = 1,
) {
  let req = ctx
    .http()
    .post('/api/plant-identifications')
    .set('Authorization', `Bearer ${auth.token}`)
    .set('X-Space-ID', auth.spaceId)
    .field('organs', organs);

  for (let i = 0; i < photoCount; i++) {
    req = req.attach('photos', PNG_BYTES, {
      filename: `photo-${i}.png`,
      contentType: 'image/png',
    });
  }

  return req;
}

/** Fake PlantNet port double — swapped in via createE2EApp's overrides. */
class FakePlantNetIdentificationPort {
  static behavior: 'resolved' | 'no_match' | 'quota' | 'failure' = 'resolved';

  async identify() {
    if (FakePlantNetIdentificationPort.behavior === 'quota') {
      const { PlantIdentificationQuotaExceededException } =
        await import('../../../src/contexts/plant-identification/domain/exceptions/plant-identification-quota-exceeded.exception');
      throw new PlantIdentificationQuotaExceededException();
    }
    if (FakePlantNetIdentificationPort.behavior === 'failure') {
      const { PlantIdentificationProviderUnavailableException } =
        await import('../../../src/contexts/plant-identification/domain/exceptions/plant-identification-provider-unavailable.exception');
      throw new PlantIdentificationProviderUnavailableException('down');
    }
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

describe('Plant Identification REST API (e2e)', () => {
  let ctx: E2EContext;
  let userA: AuthSeed;

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
  });

  describe('POST /api/plant-identifications', () => {
    it('201 — resolved path: persists candidates and the GBIF-resolved species', async () => {
      const res = await identify(ctx, userA).expect(201);

      expect(res.body.status).toBe('resolved');
      expect(res.body.resolved).toBeTruthy();
      expect(res.body.candidates.length).toBeGreaterThan(0);
      expect(res.body.photos).toHaveLength(1);
    });

    it('201 — no_match path: low-confidence top candidate stays unresolved', async () => {
      FakePlantNetIdentificationPort.behavior = 'no_match';

      const res = await identify(ctx, userA).expect(201);

      expect(res.body.status).toBe('no_match');
      expect(res.body.resolved).toBeNull();
    });

    it('429 — PlantNet quota exceeded', async () => {
      FakePlantNetIdentificationPort.behavior = 'quota';

      await identify(ctx, userA).expect(429);
    });

    it('502 — PlantNet provider unavailable', async () => {
      FakePlantNetIdentificationPort.behavior = 'failure';

      await identify(ctx, userA).expect(502);
    });

    it('400 — missing photos', async () => {
      await ctx
        .http()
        .post('/api/plant-identifications')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .field('organs', '[]')
        .expect(400);
    });

    it('400 — organs length mismatch', async () => {
      await identify(ctx, userA, '["leaf","flower"]', 1).expect(400);
    });

    it('400 — invalid organ value', async () => {
      await identify(ctx, userA, '["stem"]', 1).expect(400);
    });

    it('401 — rejects unauthenticated requests', async () => {
      await ctx
        .http()
        .post('/api/plant-identifications')
        .set('X-Space-ID', userA.spaceId)
        .field('organs', '["leaf"]')
        .attach('photos', PNG_BYTES, {
          filename: 'leaf.png',
          contentType: 'image/png',
        })
        .expect(401);
    });

    it('sends every submitted organ, one entry per photo, in a single PlantNet call', async () => {
      const res = await identify(ctx, userA, '["leaf","flower"]', 2).expect(
        201,
      );

      expect(res.body.photos).toHaveLength(2);
      expect(res.body.photos.map((p: { organ: string }) => p.organ)).toEqual([
        PlantIdentificationOrganEnum.LEAF,
        PlantIdentificationOrganEnum.FLOWER,
      ]);
    });
  });

  describe('GET /api/plant-identifications', () => {
    it('200 — lists history for the space, most recent first', async () => {
      await identify(ctx, userA).expect(201);
      await identify(ctx, userA).expect(201);

      const res = await ctx
        .http()
        .get('/api/plant-identifications')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.total).toBe(2);
    });
  });

  describe('GET /api/plant-identifications/:id', () => {
    it('200 — fetches a single identification', async () => {
      const created = await identify(ctx, userA).expect(201);

      const res = await ctx
        .http()
        .get(`/api/plant-identifications/${created.body.id}`)
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(200);

      expect(res.body.id).toBe(created.body.id);
    });

    it('404 — unknown id', async () => {
      await ctx
        .http()
        .get('/api/plant-identifications/f47ac10b-58cc-4372-a567-000000000099')
        .set('Authorization', `Bearer ${userA.token}`)
        .set('X-Space-ID', userA.spaceId)
        .expect(404);
    });
  });
});
