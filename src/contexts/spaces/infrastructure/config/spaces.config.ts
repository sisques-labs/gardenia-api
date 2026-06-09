import { registerAs } from '@nestjs/config';

export const spacesConfig = registerAs('spaces', () => ({
  invitationDefaultExpiryHours: Number(
    process.env.SPACE_INVITATION_DEFAULT_EXPIRY_HOURS ?? 24,
  ),
  invitationCodeCollisionMaxRetries: Number(
    process.env.SPACE_INVITATION_CODE_COLLISION_MAX_RETRIES ?? 5,
  ),
  maxSpacesPerUser: Number(process.env.MAX_SPACES_PER_USER ?? 5),
}));
