import { Global, Module } from '@nestjs/common';

import { CorrelationContext } from './correlation-context/correlation-context.service';
import { SpaceContext } from './space-context/space-context.service';

@Global()
@Module({
  providers: [SpaceContext, CorrelationContext],
  exports: [SpaceContext, CorrelationContext],
})
export class SharedModule {}
