import { Global, Module } from '@nestjs/common';

import { SpaceContext } from './space-context/space-context.service';

@Global()
@Module({
  providers: [SpaceContext],
  exports: [SpaceContext],
})
export class SharedModule {}
