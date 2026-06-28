import { randomUUID } from 'crypto';

import { Criteria, FilterOperator } from '@sisques-labs/nestjs-kit';

import { FileBuilder } from '../../../src/contexts/files/domain/builders/file.builder';
import { FileMimeTypeEnum } from '../../../src/contexts/files/domain/enums/file-mime-type.enum';
import {
  FILE_READ_REPOSITORY,
  IFileReadRepository,
} from '../../../src/contexts/files/domain/repositories/read/file-read.repository';
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

describe('File TypeORM repositories (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IFileWriteRepository;
  let readRepo: IFileReadRepository;

  const spaceAId = randomUUID();
  const spaceBId = randomUUID();
  const userAId = randomUUID();
  const userBId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [FilesModule] });
    writeRepo = ctx.module.get(FILE_WRITE_REPOSITORY);
    readRepo = ctx.module.get(FILE_READ_REPOSITORY);
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

  function buildFile(
    userId: string,
    overrides: { filename?: string; mimeType?: FileMimeTypeEnum } = {},
  ) {
    const id = randomUUID();
    return new FileBuilder()
      .withId(id)
      .withFilename(overrides.filename ?? 'rose.png')
      .withMimeType(overrides.mimeType ?? FileMimeTypeEnum.IMAGE_PNG)
      .withSize(2048)
      .withStorageKey(id)
      .withUrl(`/api/files/${id}/content`)
      .withUserId(userId)
      .withSpaceId(randomUUID())
      .withCreatedAt(NOW)
      .withUpdatedAt(NOW)
      .build();
  }

  it('does not find a file created in another space (tenant isolation)', async () => {
    let id: string;
    await ctx.spaceContext.run(spaceAId, async () => {
      const file = buildFile(userAId);
      await writeRepo.save(file);
      id = file.id.value;
    });

    await ctx.spaceContext.run(spaceBId, async () => {
      expect(await writeRepo.findById(id)).toBeNull();
      expect(await readRepo.findById(id)).toBeNull();
    });
  });

  it('filters by exact mimeType and partial filename', async () => {
    await ctx.spaceContext.run(spaceAId, async () => {
      await writeRepo.save(
        buildFile(userAId, {
          filename: 'rose-front.png',
          mimeType: FileMimeTypeEnum.IMAGE_PNG,
        }),
      );
      await writeRepo.save(
        buildFile(userAId, {
          filename: 'tomato.jpg',
          mimeType: FileMimeTypeEnum.IMAGE_JPEG,
        }),
      );
    });

    await ctx.spaceContext.run(spaceAId, async () => {
      const byMime = await readRepo.findByCriteria(
        new Criteria(
          [
            {
              field: 'mime_type',
              operator: FilterOperator.EQUALS,
              value: FileMimeTypeEnum.IMAGE_PNG,
            },
          ],
          undefined,
          undefined,
        ),
      );
      expect(byMime.items).toHaveLength(1);
      expect(byMime.items[0].filename).toBe('rose-front.png');

      const byName = await readRepo.findByCriteria(
        new Criteria(
          [{ field: 'filename', operator: FilterOperator.LIKE, value: 'rose' }],
          undefined,
          undefined,
        ),
      );
      expect(byName.items).toHaveLength(1);
      expect(byName.items[0].filename).toBe('rose-front.png');
    });
  });
});
