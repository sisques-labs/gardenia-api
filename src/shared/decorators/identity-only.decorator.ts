import { SetMetadata } from '@nestjs/common';

export const IDENTITY_ONLY_KEY = 'identityOnly';
export const IdentityOnly = () => SetMetadata(IDENTITY_ONLY_KEY, true);
