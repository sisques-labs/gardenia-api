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

function buildSpecies(scientificName: string) {
  return new PlantSpeciesBuilder()
    .withId(randomUUID())
    .withScientificName(scientificName)
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
    const species = buildSpecies('Monstera');
    species.create();

    const saved = await writeRepo.save(species);
    const found = await writeRepo.findById(saved.id.value);

    expect(found).not.toBeNull();
    expect(found!.scientificName.value).toBe('Monstera');
  });

  it('findByScientificName() is case-insensitive', async () => {
    const species = buildSpecies('Basil');
    species.create();
    await writeRepo.save(species);

    const found = await writeRepo.findByScientificName('basil');
    expect(found).not.toBeNull();
    expect(found!.scientificName.value).toBe('Basil');
  });

  it('delete() removes the record', async () => {
    const species = buildSpecies('Tulip');
    species.create();
    const saved = await writeRepo.save(species);

    await writeRepo.delete(saved.id.value);
    const found = await writeRepo.findById(saved.id.value);
    expect(found).toBeNull();
  });
});
