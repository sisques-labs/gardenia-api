import { registerEnumType } from '@nestjs/graphql';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import { SpaceEnvironmentEnum } from '@contexts/spaces/domain/enums/space-environment.enum';

registerEnumType(MembershipRoleEnum, { name: 'MembershipRoleEnum' });
registerEnumType(SpaceEnvironmentEnum, { name: 'SpaceEnvironmentEnum' });
