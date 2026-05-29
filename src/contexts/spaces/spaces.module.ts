import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AddMemberCommandHandler } from './application/commands/add-member/add-member.handler';
import { CreateSpaceCommandHandler } from './application/commands/create-space/create-space.handler';
import { RemoveMemberCommandHandler } from './application/commands/remove-member/remove-member.handler';
import { MembershipFindByUserAndSpaceQueryHandler } from './application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.handler';
import { SpaceFindByIdQueryHandler } from './application/queries/space-find-by-id/space-find-by-id.handler';
import { SpacesFindByUserQueryHandler } from './application/queries/spaces-find-by-user/spaces-find-by-user.handler';
import { AssertSpaceViewModelExistsService } from './application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { AssertSpaceExistsService } from './application/services/write/assert-space-exists/assert-space-exists.service';
import { SpaceMembershipBuilder } from './domain/builders/space-membership.builder';
import { SpaceBuilder } from './domain/builders/space.builder';
import { MEMBERSHIP_READ_REPOSITORY } from './domain/repositories/read/membership-read.repository';
import { SPACE_READ_REPOSITORY } from './domain/repositories/read/space-read.repository';
import { SPACE_WRITE_REPOSITORY } from './domain/repositories/write/space-write.repository';
import { SpaceMembershipEntity } from './infrastructure/persistence/typeorm/entities/space-membership.entity';
import { SpaceEntity } from './infrastructure/persistence/typeorm/entities/space.entity';
import { SpaceMembershipTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/space-typeorm.mapper';
import { SpaceMembershipTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/space-membership-typeorm-read.repository';
import { SpaceTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository';
import { SpaceTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/space-typeorm-write.repository';
import { SpaceContext } from '../../shared/space-context/space-context.service';
import { SpaceGuard } from './transport/guards/space.guard';
import { SpaceInterceptor } from './transport/interceptors/space.interceptor';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceEntity, SpaceMembershipEntity])],
  providers: [
    // Builders
    SpaceBuilder,
    SpaceMembershipBuilder,
    // Mappers
    SpaceTypeOrmMapper,
    SpaceMembershipTypeOrmMapper,
    // Read repositories
    SpaceTypeOrmReadRepository,
    SpaceMembershipTypeOrmReadRepository,
    { provide: SPACE_READ_REPOSITORY, useExisting: SpaceTypeOrmReadRepository },
    {
      provide: MEMBERSHIP_READ_REPOSITORY,
      useExisting: SpaceMembershipTypeOrmReadRepository,
    },
    // Write repositories
    SpaceTypeOrmWriteRepository,
    {
      provide: SPACE_WRITE_REPOSITORY,
      useExisting: SpaceTypeOrmWriteRepository,
    },
    // Assert services
    AssertSpaceExistsService,
    AssertSpaceViewModelExistsService,
    // Command handlers
    CreateSpaceCommandHandler,
    AddMemberCommandHandler,
    RemoveMemberCommandHandler,
    // Query handlers
    SpaceFindByIdQueryHandler,
    SpacesFindByUserQueryHandler,
    MembershipFindByUserAndSpaceQueryHandler,
    // SpaceContext (global singleton)
    SpaceContext,
    // Guard + Interceptor
    SpaceGuard,
    SpaceInterceptor,
  ],
  exports: [
    SpaceContext,
    SpaceGuard,
    SpaceInterceptor,
    SPACE_READ_REPOSITORY,
    MEMBERSHIP_READ_REPOSITORY,
    SPACE_WRITE_REPOSITORY,
    AssertSpaceExistsService,
    AssertSpaceViewModelExistsService,
    SpaceBuilder,
    SpaceMembershipBuilder,
    SpaceTypeOrmMapper,
    SpaceMembershipTypeOrmMapper,
  ],
})
export class SpacesModule {}
