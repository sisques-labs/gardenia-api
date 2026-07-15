import { ContextsModule } from '@contexts/contexts.module';
import { CoreModule } from '@core/core.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule, ContextsModule],
})
export class AppModule {}
