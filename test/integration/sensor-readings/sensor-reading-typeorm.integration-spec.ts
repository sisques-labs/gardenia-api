import { randomUUID } from 'crypto';

import { SensorReadingBuilder } from '@contexts/sensor-readings/domain/builders/sensor-reading.builder';
import {
  ISensorReadingReadRepository,
  SENSOR_READING_READ_REPOSITORY,
} from '@contexts/sensor-readings/domain/repositories/read/sensor-reading-read.repository';
import {
  ISensorReadingWriteRepository,
  SENSOR_READING_WRITE_REPOSITORY,
} from '@contexts/sensor-readings/domain/repositories/write/sensor-reading-write.repository';
import { SensorReadingsModule } from '@contexts/sensor-readings/sensor-readings.module';

import { truncateAll } from '../../helpers/db-reset';
import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { seedSpaceWithUser } from '../../helpers/tenant-seed';

describe('SensorReading repositories (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: ISensorReadingWriteRepository;
  let readRepo: ISensorReadingReadRepository;
  let builder: SensorReadingBuilder;

  const spaceA = randomUUID();
  const spaceB = randomUUID();
  const userA = randomUUID();
  const userB = randomUUID();
  const plantId = randomUUID();

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [SensorReadingsModule] });
    writeRepo = ctx.module.get(SENSOR_READING_WRITE_REPOSITORY);
    readRepo = ctx.module.get(SENSOR_READING_READ_REPOSITORY);
    builder = ctx.module.get(SensorReadingBuilder);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
    await seedSpaceWithUser(ctx.dataSource, spaceA, userA, {
      spaceName: 'A',
      username: 'a',
    });
    await seedSpaceWithUser(ctx.dataSource, spaceB, userB, {
      spaceName: 'B',
      username: 'b',
    });
  });

  function reading(spaceId: string, metric: string, value: number, at: Date) {
    return builder
      .withId(randomUUID())
      .withPlantId(plantId)
      .withSpaceId(spaceId)
      .withMetric(metric)
      .withValue(value)
      .withUnit('%')
      .withMeasuredAt(at)
      .withSource('home_assistant')
      .build();
  }

  it('returns the latest reading per metric for a plant in the space', async () => {
    await ctx.spaceContext.run(spaceA, async () => {
      await writeRepo.save(
        reading(spaceA, 'moisture', 10, new Date('2026-06-01T00:00:00Z')),
      );
      await writeRepo.save(
        reading(spaceA, 'moisture', 35, new Date('2026-06-02T00:00:00Z')),
      );
      await writeRepo.save(
        reading(spaceA, 'temperature', 21, new Date('2026-06-02T00:00:00Z')),
      );
    });

    const latest = await ctx.spaceContext.run(spaceA, () =>
      readRepo.findLatestByPlant(plantId),
    );

    const byMetric = Object.fromEntries(latest.map((r) => [r.metric, r.value]));
    expect(byMetric).toEqual({ moisture: 35, temperature: 21 });
  });

  it('does not leak readings across spaces', async () => {
    await ctx.spaceContext.run(spaceA, () =>
      writeRepo.save(
        reading(spaceA, 'moisture', 50, new Date('2026-06-02T00:00:00Z')),
      ),
    );

    const fromB = await ctx.spaceContext.run(spaceB, () =>
      readRepo.findLatestByPlant(plantId),
    );
    expect(fromB).toHaveLength(0);
  });
});
