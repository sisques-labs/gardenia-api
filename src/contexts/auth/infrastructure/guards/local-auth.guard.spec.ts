import { AuthGuard } from '@nestjs/passport';

import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  it('is an instance of the passport "local" AuthGuard', () => {
    const guard = new LocalAuthGuard();

    expect(guard).toBeInstanceOf(LocalAuthGuard);
    expect(guard).toBeInstanceOf(AuthGuard('local'));
  });
});
