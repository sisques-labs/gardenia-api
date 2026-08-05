import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';

import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';

@Module({
  imports: [SentryModule.forRoot()],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    // Order matters: CorrelationIdInterceptor must run first so its ALS
    // frame (and the resolved correlationId) is available to
    // HttpLoggingInterceptor and to any handler logging inside the request.
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class ObservabilityModule {}
