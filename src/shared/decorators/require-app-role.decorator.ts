import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { SetMetadata } from '@nestjs/common';

export const APP_ROLE_KEY = 'appRole';

/**
 * Marks a resolver or controller route as requiring specific app-level roles.
 * Must be used AFTER @UseGuards(JwtAuthGuard) so req.user.appRole is populated.
 *
 * @example
 * @UseGuards(JwtAuthGuard, AppRoleGuard)
 * @RequireAppRole(AppRoleEnum.ADMIN)
 * async adminOnlyResolver() {}
 */
export const RequireAppRole = (...roles: AppRoleEnum[]) =>
  SetMetadata(APP_ROLE_KEY, roles);
