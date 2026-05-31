import { randomUUID } from 'crypto';

import { QrBuilder } from '../../../src/contexts/qr/domain/builders/qr.builder';
import {
  IQrWriteRepository,
  QR_WRITE_REPOSITORY,
} from '../../../src/contexts/qr/domain/repositories/write/qr-write.repository';
import { QrModule } from '../../../src/contexts/qr/qr.module';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildQr(plantId: string, targetUrl: string) {
  return new QrBuilder()
    .withId(randomUUID())
    .withPlantId(plantId)
    .withSpaceId(PLACEHOLDER_SPACE_ID)
    .withTargetUrl(targetUrl)
    .withGeneration(1)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('QrTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let qrWriteRepo: IQrWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [QrModule] });
    qrWriteRepo = ctx.module.get(QR_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('persists QR with PNG and finds by plant id', async () => {
    const plantId = randomUUID();
    const targetUrl = `http://localhost:3000/plants/${plantId}?spaceId=${spaceAId}`;
    const png = Buffer.from('fake-png');

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(plantId, targetUrl);
      qr.create();
      const saved = await qrWriteRepo.save(qr, png);

      expect(saved.id.value).toBe(qr.id.value);
      expect(saved.targetUrl.value).toBe(targetUrl);

      const found = await qrWriteRepo.findByPlantId(plantId);
      expect(found).not.toBeNull();
      expect(found!.plantId.value).toBe(plantId);
    });
  });

  it('findByPlantId returns null for QR in another space', async () => {
    const plantId = randomUUID();
    const targetUrl = `http://localhost:3000/plants/${plantId}?spaceId=${spaceAId}`;

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(plantId, targetUrl);
      qr.create();
      await qrWriteRepo.save(qr, Buffer.from('png'));
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const found = await qrWriteRepo.findByPlantId(plantId);
      expect(found).toBeNull();
    });
  });

  it('deleteByPlantId removes the QR row', async () => {
    const plantId = randomUUID();
    const targetUrl = `http://localhost:3000/plants/${plantId}?spaceId=${spaceAId}`;

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(plantId, targetUrl);
      qr.create();
      await qrWriteRepo.save(qr, Buffer.from('png'));

      await qrWriteRepo.deleteByPlantId(plantId);

      const found = await qrWriteRepo.findByPlantId(plantId);
      expect(found).toBeNull();
    });
  });
});
