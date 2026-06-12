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
import { seedSpace } from '../../helpers/tenant-seed';

const NOW = new Date('2024-06-01T00:00:00.000Z');
const PLACEHOLDER_SPACE_ID = randomUUID();

function buildQr(targetUrl: string) {
  return new QrBuilder()
    .withId(randomUUID())
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
    await seedSpace(ctx.dataSource, spaceAId, randomUUID(), 'Space A');
    await seedSpace(ctx.dataSource, spaceBId, randomUUID(), 'Space B');
  });

  it('persists QR with PNG and finds by id', async () => {
    const targetUrl = `http://localhost:3000/resource/${randomUUID()}`;
    const png = Buffer.from('fake-png');

    let qrId: string;

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(targetUrl);
      qr.create();
      const saved = await qrWriteRepo.save(qr, png);

      expect(saved.targetUrl.value).toBe(targetUrl);
      qrId = saved.id.value;
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const found = await qrWriteRepo.findById(qrId!);
      expect(found).not.toBeNull();
      expect(found!.targetUrl.value).toBe(targetUrl);
    });
  });

  it('findById returns null for QR in another space', async () => {
    const targetUrl = `http://localhost:3000/resource/${randomUUID()}`;
    let qrId: string;

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(targetUrl);
      qr.create();
      const saved = await qrWriteRepo.save(qr, Buffer.from('png'));
      qrId = saved.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      const found = await qrWriteRepo.findById(qrId!);
      expect(found).toBeNull();
    });
  });

  it('delete removes the QR row', async () => {
    const targetUrl = `http://localhost:3000/resource/${randomUUID()}`;

    await ctx.spaceContext.run(spaceAId, async () => {
      const qr = buildQr(targetUrl);
      qr.create();
      const saved = await qrWriteRepo.save(qr, Buffer.from('png'));

      await qrWriteRepo.delete(saved.id.value);

      const found = await qrWriteRepo.findById(saved.id.value);
      expect(found).toBeNull();
    });
  });
});
