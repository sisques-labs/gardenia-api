import { CommandBus } from '@nestjs/cqrs';

import { CreateQrCommand } from '@contexts/qr/application/commands/create-qr/create-qr.command';

import { SpaceQrAdapter } from './space-qr.adapter';

describe('SpaceQrAdapter', () => {
  it('dispatches CreateQrCommand with invitation payload', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue('qr-id'),
    } as unknown as jest.Mocked<CommandBus>;

    const adapter = new SpaceQrAdapter(commandBus);
    const expiresAt = new Date('2026-06-10T12:00:00.000Z');

    const qrId = await adapter.createInvitationQr({
      targetUrl: 'https://app.test/invite?code=LIM',
      spaceId: '550e8400-e29b-41d4-a716-446655440001',
      expiresAt,
    });

    expect(qrId).toBe('qr-id');
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(CreateQrCommand),
    );
    const command = commandBus.execute.mock.calls[0][0] as CreateQrCommand;
    expect(command.targetUrl.value).toBe('https://app.test/invite?code=LIM');
    expect(command.spaceId.value).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(command.expiresAt?.value).toEqual(expiresAt);
  });
});
