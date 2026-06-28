import { randomUUID } from 'crypto';

import {
  FILE_STORAGE_PORT,
  IFileStoragePort,
} from '../../../src/contexts/files/application/ports/file-storage.port';
import { FileBuilder } from '../../../src/contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '../../../src/contexts/files/domain/enums/file-mime-type.enum';
import {
  FILE_WRITE_REPOSITORY,
  IFileWriteRepository,
} from '../../../src/contexts/files/domain/repositories/write/file-write.repository';
import { FilesModule } from '../../../src/contexts/files/files.module';
import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

const NOW = new Date('2026-06-01T00:00:00.000Z');

describe('DatabaseFileStorageAdapter (integration)', () => {
  let ctx: IntegrationContext;
  let storage: IFileStoragePort;
  let writeRepo: IFileWriteRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [FilesModule] });
    storage = ctx.module.get(FILE_STORAGE_PORT);
    writeRepo = ctx.module.get(FILE_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceAId, userAId, {
      spaceName: 'Space A',
      username: 'owner_a',
    });
    await seedSpaceWithUser(ctx.dataSource, spaceBId, userBId, {
      spaceName: 'Space B',
      username: 'owner_b',
    });
  });

  async function persistMetadata(
    spaceId: string,
    userId: string,
  ): Promise<string> {
    const id = randomUUID();
    await ctx.spaceContext.run(spaceId, async () => {
      const file = new FileBuilder()
        .withId(id)
        .withFilename('rose.png')
        .withMimeType(FileMimeTypeEnum.IMAGE_PNG)
        .withSize(6)
        .withStorageKey(id)
        .withUrl(`/api/files/${id}/content`)
        .withUserId(userId)
        .withSpaceId(randomUUID())
        .withCreatedAt(NOW)
        .withUpdatedAt(NOW)
        .build();
      await writeRepo.save(file);
    });
    return id;
  }

  it('round-trips the raw bytes through the bytea column', async () => {
    const id = await persistMetadata(spaceAId, userAId);
    const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);

    await ctx.spaceContext.run(spaceAId, async () => {
      await storage.save({
        key: id,
        bytes,
        mimeType: 'image/png',
        spaceId: spaceAId,
      });
      const read = await storage.read(id);
      expect(read).not.toBeNull();
      expect(Buffer.compare(read!, bytes)).toBe(0);
    });
  });

  it('does not read content from another space (tenant isolation)', async () => {
    const id = await persistMetadata(spaceAId, userAId);

    await ctx.spaceContext.run(spaceAId, async () => {
      await storage.save({
        key: id,
        bytes: Buffer.from('secret'),
        mimeType: 'image/png',
        spaceId: spaceAId,
      });
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      expect(await storage.read(id)).toBeNull();
    });
  });

  it('cascades: deleting the file metadata removes its bytes', async () => {
    const id = await persistMetadata(spaceAId, userAId);

    await ctx.spaceContext.run(spaceAId, async () => {
      await storage.save({
        key: id,
        bytes: Buffer.from('bytes'),
        mimeType: 'image/png',
        spaceId: spaceAId,
      });
      await writeRepo.delete(id);
      expect(await storage.read(id)).toBeNull();
    });
  });
});
