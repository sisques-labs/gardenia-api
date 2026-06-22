import { Controller, Get, Logger, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrometheusController } from '@willsoto/nestjs-prometheus';
import { Response } from 'express';

import { SkipSpace } from '@shared/decorators/skip-space.decorator';

/**
 * Public Prometheus scrape endpoint. Resolves to `GET /api/metrics` (the
 * `@willsoto/nestjs-prometheus` module forces the route path; the global `api`
 * prefix is applied by Nest).
 *
 * `@SkipSpace()` makes both global guards (`OptionalJwtAuthGuard`, `SpaceGuard`)
 * short-circuit so scrapers need no JWT and no `X-Space-ID` — same posture as the
 * health probe. Access is expected to be restricted at the network layer.
 */
@ApiTags('metrics')
@Controller()
export class MetricsController extends PrometheusController {
  private readonly logger = new Logger(MetricsController.name);

  @Get()
  @SkipSpace()
  @ApiOperation({ summary: 'Prometheus metrics exposition' })
  index(@Res({ passthrough: true }) response: Response): Promise<string> {
    this.logger.debug('Metrics scrape requested');
    return super.index(response);
  }
}
