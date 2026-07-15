import { randomUUID } from 'crypto';

import { PlantSpeciesBuilder } from '../../../src/contexts/plant-species/domain/builders/plant-species.builder';
import {
  IPlantSpeciesWriteRepository,
  PLANT_SPECIES_WRITE_REPOSITORY,
} from '../../../src/contexts/plant-species/domain/repositories/write/plant-species-write.repository';
import { PlantSpeciesModule } from '../../../src/contexts/plant-species/plant-species.module';

import {
  createIntegrationModule,
  IntegrationContext,
} from '../../helpers/integration-bootstrap';
import { truncateAll } from '../../helpers/db-reset';

const NOW = new Date('2024-06-01T00:00:00.000Z');

function buildSpecies(scientificName: string, gbifKey: number) {
  return new PlantSpeciesBuilder()
    .withId(randomUUID())
    .withScientificName(scientificName)
    .withGbifKey(gbifKey)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();
}

describe('PlantSpeciesTypeOrmWriteRepository (integration)', () => {
  let ctx: IntegrationContext;
  let writeRepo: IPlantSpeciesWriteRepository;

  beforeAll(async () => {
    ctx = await createIntegrationModule({ imports: [PlantSpeciesModule] });
    writeRepo = ctx.module.get(PLANT_SPECIES_WRITE_REPOSITORY);
  });

  afterAll(async () => {
    await ctx.close();
  });

  beforeEach(async () => {
    await truncateAll(ctx.dataSource);
  });

  it('save() persists and findById() returns the aggregate', async () => {
    const species = buildSpecies('Monstera', 2882337);
    species.create();

    const saved = await writeRepo.save(species);
    const found = await writeRepo.findById(saved.id.value);

    expect(found).not.toBeNull();
    expect(found!.scientificName.value).toBe('Monstera');
    expect(found!.gbifKey?.value).toBe(2882337);
  });

  it('findByGbifKey() returns the matching entry', async () => {
    const species = buildSpecies('Basil', 3086357);
    species.create();
    await writeRepo.save(species);

    const found = await writeRepo.findByGbifKey(3086357);
    expect(found).not.toBeNull();
    expect(found!.scientificName.value).toBe('Basil');
  });

  it('findByGbifKey() returns null when no entry matches', async () => {
    const found = await writeRepo.findByGbifKey(999999999);
    expect(found).toBeNull();
  });

  it('delete() removes the record', async () => {
    const species = buildSpecies('Tulip', 3033842);
    species.create();
    const saved = await writeRepo.save(species);

    await writeRepo.delete(saved.id.value);
    const found = await writeRepo.findById(saved.id.value);
    expect(found).toBeNull();
  });
});
