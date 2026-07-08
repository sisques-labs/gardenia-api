export const PLANTS_PORT = Symbol('PLANTS_PORT');

/**
 * Seam into the `plants` bounded context. Implemented by an adapter that
 * dispatches `UpdatePlantCommand`/`PlantFindByIdQuery` via the global
 * `CommandBus`/`QueryBus` — no direct import of `plants` domain/application
 * from here. `updateImageUrl` may reject (e.g. a dangling `plantId`, since
 * it is not FK-validated) — callers treat it as best-effort and catch +
 * log rather than failing the whole operation.
 */
export interface IPlantsPort {
  /** Returns the plant's current `imageUrl`, or `null` if unknown/not found. */
  getImageUrl(plantId: string): Promise<string | null>;
  updateImageUrl(
    plantId: string,
    imageUrl: string | null,
    requestingUserId: string,
  ): Promise<void>;
}
