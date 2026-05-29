import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

import { SpaceContext } from '../../../../shared/space-context/space-context.service';

@Injectable()
export class SpaceInterceptor implements NestInterceptor {
  constructor(private readonly spaceContext: SpaceContext) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = this.getRequest(context);
    const spaceId = req['spaceId'] as string | undefined;

    if (!spaceId) {
      return next.handle();
    }

    return new Observable((subscriber) => {
      this.spaceContext.run(spaceId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }

  private getRequest(context: ExecutionContext): Record<string, unknown> {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: Record<string, unknown>;
      }>().req;
    }
    return context.switchToHttp().getRequest<Record<string, unknown>>();
  }
}
