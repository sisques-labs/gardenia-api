import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';

import { CorrelationContext } from '@shared/correlation-context/correlation-context.service';

export const CORRELATION_ID_HEADER = 'x-request-id';

interface IHttpPair {
  req: Record<string, unknown>;
  res: { setHeader: (name: string, value: string) => void };
}

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  constructor(private readonly correlationContext: CorrelationContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { req, res } = this.getHttpPair(context);
    const headers = req['headers'] as
      Record<string, string | string[] | undefined> | undefined;
    const incoming = headers?.[CORRELATION_ID_HEADER];
    const correlationId =
      typeof incoming === 'string' && incoming.trim() !== ''
        ? incoming
        : randomUUID();

    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    return new Observable((subscriber) => {
      this.correlationContext.run(correlationId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  private getHttpPair(context: ExecutionContext): IHttpPair {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<IHttpPair>();
    }
    const http = context.switchToHttp();
    return {
      req: http.getRequest<Record<string, unknown>>(),
      res: http.getResponse<IHttpPair['res']>(),
    };
  }
}
