export type GbifSpeciesSearchQueryInput = {
  name: string;
  limit?: number;
};

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 20;

export class GbifSpeciesSearchQuery {
  public readonly name: string;
  public readonly limit: number;

  constructor(input: GbifSpeciesSearchQueryInput) {
    this.name = input.name.trim();
    this.limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  }
}
