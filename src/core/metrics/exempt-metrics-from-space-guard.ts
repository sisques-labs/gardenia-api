import { MetricsController } from '@sisques-labs/nestjs-kit/metrics';

import { SkipSpace } from '@shared/decorators/skip-space.decorator';

/**
 * The kit's `MetricsController` has no opinion on auth — gardenia-api's
 * global guards (`OptionalJwtAuthGuard`, `SpaceGuard`) would otherwise block
 * Prometheus scrapes (no JWT, no `X-Space-ID`), same posture as the health
 * probe. `@SkipSpace()` is just `SetMetadata` under the hood, so it can be
 * applied imperatively to a class this app doesn't own — equivalent to
 * writing `@SkipSpace()` directly on the controller.
 *
 * Imported once (side effect) in `AppModule`, before `MetricsModule.forRoot`
 * registers the controller.
 */
SkipSpace()(MetricsController);
