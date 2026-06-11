import { PlantSpeciesImportLimitValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-import-limit/plant-species-import-limit.value-object';
import { PlantSpeciesImportOffsetValueObject } from '@contexts/plant-species/domain/value-objects/plant-species-import-offset/plant-species-import-offset.value-object';

export interface ImportPlantSpeciesCommandInput {
  limit: number;
  offset: number;
}

export class ImportPlantSpeciesCommand {
  public readonly limit: PlantSpeciesImportLimitValueObject;
  public readonly offset: PlantSpeciesImportOffsetValueObject;

  constructor(input: ImportPlantSpeciesCommandInput) {
    this.limit = new PlantSpeciesImportLimitValueObject(input.limit);
    this.offset = new PlantSpeciesImportOffsetValueObject(input.offset);
  }
}
