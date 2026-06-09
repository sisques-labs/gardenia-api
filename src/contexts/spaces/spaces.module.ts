import './transport/graphql/enums/space/space-registered-enums.graphql';

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { spacesConfig } from './infrastructure/config/spaces.config';

import { AcceptSpaceInvitationCommandHandler } from './application/commands/accept-space-invitation/accept-space-invitation.handler';
import { AddMemberCommandHandler } from './application/commands/add-member/add-member.handler';
import { CreateSpaceInvitationCommandHandler } from './application/commands/create-space-invitation/create-space-invitation.handler';
import { CreateSpaceCommandHandler } from './application/commands/create-space/create-space.handler';
import { RemoveMemberCommandHandler } from './application/commands/remove-member/remove-member.handler';
import { SPACE_QR_PORT } from './application/ports/space-qr.port';
import { SPACE_USER_PORT } from './application/ports/space-user.port';
import { MembershipFindByUserAndSpaceQueryHandler } from './application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.handler';
import { SpaceFindByIdQueryHandler } from './application/queries/space-find-by-id/space-find-by-id.handler';
import { SpacesFindByUserQueryHandler } from './application/queries/spaces-find-by-user/spaces-find-by-user.handler';
import { AssertSpaceInvitationViewModelExistsByCodeService } from './application/services/read/assert-space-invitation-view-model-exists-by-code/assert-space-invitation-view-model-exists-by-code.service';
import { AssertSpaceViewModelExistsService } from './application/services/read/assert-space-view-model-exists/assert-space-view-model-exists.service';
import { AssertSpaceExistsService } from './application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertSpaceInvitationNotExpiredService } from './application/services/write/assert-space-invitation-not-expired/assert-space-invitation-not-expired.service';
import { AssertUserIsSpaceMemberService } from './application/services/write/assert-user-is-space-member/assert-user-is-space-member.service';
import { AssertUserIsSpaceOwnerService } from './application/services/write/assert-user-is-space-owner/assert-user-is-space-owner.service';
import { AssertUserNotSpaceMemberService } from './application/services/write/assert-user-not-space-member/assert-user-not-space-member.service';
import { GenerateUniqueInvitationCodeService } from './application/services/write/generate-unique-invitation-code/generate-unique-invitation-code.service';
import { InviteCodeGeneratorService } from './application/services/write/invite-code-generator/invite-code-generator.service';
import { ResolveInvitationSpaceContextService } from './application/services/write/resolve-invitation-space-context/resolve-invitation-space-context.service';
import { SpaceInvitationTargetUrlBuilderService } from './application/services/write/space-invitation-target-url-builder/space-invitation-target-url-builder.service';
import { SpaceInvitationBuilder } from './domain/builders/space-invitation.builder';
import { SpaceMembershipBuilder } from './domain/builders/space-membership.builder';
import { SpaceBuilder } from './domain/builders/space.builder';
import { MEMBERSHIP_READ_REPOSITORY } from './domain/repositories/read/membership-read.repository';
import { SPACE_INVITATION_READ_REPOSITORY } from './domain/repositories/read/space-invitation-read.repository';
import { SPACE_READ_REPOSITORY } from './domain/repositories/read/space-read.repository';
import { SPACE_INVITATION_WRITE_REPOSITORY } from './domain/repositories/write/space-invitation-write.repository';
import { SPACE_WRITE_REPOSITORY } from './domain/repositories/write/space-write.repository';
import { SpaceQrAdapter } from './infrastructure/adapters/space-qr.adapter';
import { SpaceUserAdapter } from './infrastructure/adapters/space-user.adapter';
import { SpaceInvitationEntity } from './infrastructure/persistence/typeorm/entities/space-invitation.entity';
import { SpaceMembershipEntity } from './infrastructure/persistence/typeorm/entities/space-membership.entity';
import { SpaceEntity } from './infrastructure/persistence/typeorm/entities/space.entity';
import { SpaceInvitationTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/space-invitation-typeorm.mapper';
import { SpaceMembershipTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/space-membership-typeorm.mapper';
import { SpaceTypeOrmMapper } from './infrastructure/persistence/typeorm/mappers/space-typeorm.mapper';
import { SpaceInvitationTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/space-invitation-typeorm-read.repository';
import { SpaceInvitationTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/space-invitation-typeorm-write.repository';
import { SpaceMembershipTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/space-membership-typeorm-read.repository';
import { SpaceTypeOrmReadRepository } from './infrastructure/persistence/typeorm/repositories/space-typeorm-read.repository';
import { SpaceTypeOrmWriteRepository } from './infrastructure/persistence/typeorm/repositories/space-typeorm-write.repository';
import { SpaceGuard } from './transport/guards/space.guard';
import { SpaceInterceptor } from './transport/interceptors/space.interceptor';
import { SpaceInvitationGraphQLMapper } from './transport/graphql/mappers/space-invitation/space-invitation.mapper';
import { SpaceGraphQLMapper } from './transport/graphql/mappers/space/space.mapper';
import { SpaceMutationsResolver } from './transport/graphql/resolvers/space/space-mutations.resolver';
import { SpaceQueriesResolver } from './transport/graphql/resolvers/space/space-queries.resolver';
import { InvitationsController } from './transport/rest/controllers/invitations.controller';
import { SpacesController } from './transport/rest/controllers/spaces.controller';
import { SpaceInvitationRestMapper } from './transport/rest/mappers/space-invitation/space-invitation.mapper';
import { SpaceRestMapper } from './transport/rest/mappers/space/space.mapper';

const COMMAND_HANDLERS = [
  CreateSpaceCommandHandler,
  CreateSpaceInvitationCommandHandler,
  AcceptSpaceInvitationCommandHandler,
  AddMemberCommandHandler,
  RemoveMemberCommandHandler,
];

const QUERY_HANDLERS = [
  SpaceFindByIdQueryHandler,
  SpacesFindByUserQueryHandler,
  MembershipFindByUserAndSpaceQueryHandler,
];

const APPLICATION_SERVICES = [
  AssertSpaceExistsService,
  AssertSpaceInvitationNotExpiredService,
  AssertSpaceInvitationViewModelExistsByCodeService,
  AssertSpaceViewModelExistsService,
  AssertUserIsSpaceMemberService,
  AssertUserIsSpaceOwnerService,
  AssertUserNotSpaceMemberService,
  GenerateUniqueInvitationCodeService,
  InviteCodeGeneratorService,
  ResolveInvitationSpaceContextService,
  SpaceInvitationTargetUrlBuilderService,
];

const DOMAIN_BUILDERS = [
  SpaceBuilder,
  SpaceMembershipBuilder,
  SpaceInvitationBuilder,
];

const INFRASTRUCTURE_ADAPTERS = [
  { provide: SPACE_QR_PORT, useClass: SpaceQrAdapter },
  { provide: SPACE_USER_PORT, useClass: SpaceUserAdapter },
];

const INFRASTRUCTURE_REPOSITORIES = [
  { provide: SPACE_READ_REPOSITORY, useClass: SpaceTypeOrmReadRepository },
  {
    provide: MEMBERSHIP_READ_REPOSITORY,
    useClass: SpaceMembershipTypeOrmReadRepository,
  },
  {
    provide: SPACE_INVITATION_READ_REPOSITORY,
    useClass: SpaceInvitationTypeOrmReadRepository,
  },
  { provide: SPACE_WRITE_REPOSITORY, useClass: SpaceTypeOrmWriteRepository },
  {
    provide: SPACE_INVITATION_WRITE_REPOSITORY,
    useClass: SpaceInvitationTypeOrmWriteRepository,
  },
];

const INFRASTRUCTURE_MAPPERS = [
  SpaceTypeOrmMapper,
  SpaceMembershipTypeOrmMapper,
  SpaceInvitationTypeOrmMapper,
];

const INFRASTRUCTURE_ENTITIES = [
  SpaceEntity,
  SpaceMembershipEntity,
  SpaceInvitationEntity,
];

const GRAPHQL_PROVIDERS = [
  SpaceQueriesResolver,
  SpaceMutationsResolver,
  SpaceGraphQLMapper,
  SpaceInvitationGraphQLMapper,
];

const TRANSPORT_PROVIDERS = [
  SpaceGuard,
  SpaceInterceptor,
  SpaceRestMapper,
  SpaceInvitationRestMapper,
];

const REST_CONTROLLERS = [SpacesController, InvitationsController];

@Module({
  imports: [
    ConfigModule.forFeature(spacesConfig),
    CqrsModule,
    TypeOrmModule.forFeature(INFRASTRUCTURE_ENTITIES),
  ],
  controllers: [...REST_CONTROLLERS],
  providers: [
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...APPLICATION_SERVICES,
    ...DOMAIN_BUILDERS,
    ...INFRASTRUCTURE_ADAPTERS,
    ...INFRASTRUCTURE_MAPPERS,
    ...INFRASTRUCTURE_REPOSITORIES,
    ...GRAPHQL_PROVIDERS,
    ...TRANSPORT_PROVIDERS,
  ],
  exports: [],
})
export class SpacesModule {}
