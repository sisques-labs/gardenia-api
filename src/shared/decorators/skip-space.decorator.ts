import { SetMetadata } from '@nestjs/common';

export const SKIP_SPACE_KEY = 'skipSpace';
export const SkipSpace = () => SetMetadata(SKIP_SPACE_KEY, true);
