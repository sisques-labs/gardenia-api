import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CorrelationContext } from './correlation-context.service';
import { CorrelationIdInterceptor } from './interceptors/correlation-id.interceptor';
import { HttpLoggingInterceptor } from './interceptors/http-logging.interceptor';

@Module({
  providers: [
    CorrelationContext,
    // Order matters: CorrelationIdInterceptor must run first so its ALS
    // frame (and the resolved correlationId) is available to
    // HttpLoggingInterceptor and to any handler logging inside the request.
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: HttpLoggingInterceptor },
  ],
})
export class ObservabilityModule {}
