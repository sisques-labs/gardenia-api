import { ConfigService } from '@nestjs/config';

import { SpaceInvitationTargetUrlBuilderService } from './space-invitation-target-url-builder.service';

describe('SpaceInvitationTargetUrlBuilderService', () => {
  let service: SpaceInvitationTargetUrlBuilderService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      getOrThrow: jest.fn().mockReturnValue('https://gardenia.app'),
    } as unknown as jest.Mocked<ConfigService>;
    service = new SpaceInvitationTargetUrlBuilderService(configService);
  });

  it('builds an invite URL from the configured base URL', async () => {
    const url = await service.execute({ displayCode: 'ABC-123' });

    expect(configService.getOrThrow).toHaveBeenCalledWith('app.qrBaseUrl');
    expect(url).toBe('https://gardenia.app/invite?code=ABC-123');
  });

  it('URL-encodes the display code', async () => {
    const url = await service.execute({ displayCode: 'ABC · 2026 · 7Z' });

    expect(url).toBe(
      `https://gardenia.app/invite?code=${encodeURIComponent('ABC · 2026 · 7Z')}`,
    );
  });
});
