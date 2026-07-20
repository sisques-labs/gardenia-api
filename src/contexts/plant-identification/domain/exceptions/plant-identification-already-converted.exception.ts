import { BaseException } from '@sisques-labs/nestjs-kit';

/**
 * Domain invariant guard on `PlantIdentificationAggregate.convertToPlant()`
 * (see `tasks.md` 1.22: "guard: throws if already converted"). Not called
 * out as a distinct row in design.md's error-handling table because the
 * application-layer 409 (`PlantIdentificationNotResolvedException`) already
 * blocks conversion attempts before this guard would ever trigger in the
 * single documented call path — this exists as a defensive aggregate-level
 * invariant, mapped to the same 409 status.
 */
export class PlantIdentificationAlreadyConvertedException extends BaseException {
  constructor(id: string) {
    super(`Plant identification '${id}' has already been converted to a plant`);
  }
}
