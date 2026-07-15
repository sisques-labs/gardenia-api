import { Global, Module } from '@nestjs/common';

import { SpaceContext } from './space-context/space-context.service';
import { SpaceDirectoryAdapter } from './space-directory/space-directory.adapter';
import { SPACE_DIRECTORY_PORT } from './space-directory/space-directory.port';

const SPACE_DIRECTORY_PROVIDER = {
  provide: SPACE_DIRECTORY_PORT,
  useClass: SpaceDirectoryAdapter,
};

@Global()
@Module({
  providers: [SpaceContext, SPACE_DIRECTORY_PROVIDER],
  exports: [SpaceContext, SPACE_DIRECTORY_PORT],
})
export class SharedModule {}
