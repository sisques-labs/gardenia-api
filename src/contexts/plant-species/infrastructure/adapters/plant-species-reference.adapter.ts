import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { IPlantSpeciesReferencePort } from '@contexts/plant-species/application/ports/plant-species-reference.port';

// TODO: check this adapter, is it correct?
@Injectable()
export class PlantSpeciesReferenceAdapter implements IPlantSpeciesReferencePort {
  constructor(private readonly dataSource: DataSource) {}

  async countPlantsBySpeciesId(plantSpeciesId: string): Promise<number> {
    const result = await this.dataSource.query<{ count: number }[]>(
      `SELECT COUNT(*)::int AS count FROM plants WHERE plant_species_id = $1`,
      [plantSpeciesId],
    );

    return result[0]?.count ?? 0;
  }
}
