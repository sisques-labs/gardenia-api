import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import {
  makeCounterProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';

import { CqrsMetricsService } from './cqrs/cqrs-metrics.service';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';
import {
  CQRS_EVENTS_PUBLISHED_TOTAL,
  CQRS_HANDLER_DURATION,
  CQRS_HANDLER_TOTAL,
  CQRS_LABELS,
  DURATION_BUCKETS,
  EVENT_LABELS,
  HTTP_LABELS,
  HTTP_REQUEST_DURATION,
  HTTP_REQUESTS_TOTAL,
} from './metrics.constants';
import { MetricsController } from './transport/metrics.controller';

const METRIC_PROVIDERS = [
  makeHistogramProvider({
    name: HTTP_REQUEST_DURATION,
    help: 'HTTP request duration in seconds (REST + GraphQL)',
    labelNames: [...HTTP_LABELS],
    buckets: DURATION_BUCKETS,
  }),
  makeCounterProvider({
    name: HTTP_REQUESTS_TOTAL,
    help: 'Total HTTP requests (REST + GraphQL)',
    labelNames: [...HTTP_LABELS],
  }),
  makeHistogramProvider({
    name: CQRS_HANDLER_DURATION,
    help: 'CQRS command/query handler duration in seconds',
    labelNames: [...CQRS_LABELS],
    buckets: DURATION_BUCKETS,
  }),
  makeCounterProvider({
    name: CQRS_HANDLER_TOTAL,
    help: 'Total CQRS commands/queries executed',
    labelNames: [...CQRS_LABELS],
  }),
  makeCounterProvider({
    name: CQRS_EVENTS_PUBLISHED_TOTAL,
    help: 'Total domain events published on the EventBus',
    labelNames: [...EVENT_LABELS],
  }),
];

/**
 * Wires Prometheus instrumentation:
 * - `GET /api/metrics` exposition endpoint + Node/process default collectors.
 * - HTTP (REST + GraphQL) duration/count via a global interceptor.
 * - CQRS command/query duration/count + event publish counter via
 *   {@link CqrsMetricsService} (wraps the shared bus singletons at startup).
 */
@Module({
  imports: [
    CqrsModule,
    PrometheusModule.register({
      controller: MetricsController,
      defaultMetrics: { enabled: true },
      defaultLabels: { app: 'gardenia-api' },
    }),
  ],
  providers: [
    ...METRIC_PROVIDERS,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
    CqrsMetricsService,
  ],
})
export class MetricsModule {}
