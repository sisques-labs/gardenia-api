import { registerEnumType } from '@nestjs/graphql';

import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';

registerEnumType(MembershipRoleEnum, { name: 'MembershipRoleEnum' });
