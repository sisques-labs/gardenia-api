import { SpaceHaSummary } from '@contexts/home-assistant/domain/interfaces/space-ha-summary.interface';

export const SPACE_SUMMARY_PORT = Symbol('SPACE_SUMMARY_PORT');

/** Reads per-space aggregate counts (plants/harvests/inventory) via the bus. */
export interface ISpaceSummaryPort {
  getSummary(spaceId: string): Promise<SpaceHaSummary>;
}
