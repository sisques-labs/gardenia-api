import { CommandBus } from '@nestjs/cqrs';
import { MutationResponseGraphQLMapper } from '@sisques-labs/nestjs-kit';

import { RegenerateQrCommand } from '@contexts/qr/application/commands/regenerate-qr/regenerate-qr.command';
import { QrRegenerateRequestDto } from '../../dtos/requests/qr/qr-regenerate.request.dto';
import { QrMutationsResolver } from './qr-mutations.resolver';

const QR_ID = 'a1b2c3d4-e5f6-4890-abcd-ef1234567890';

describe('QrMutationsResolver', () => {
  let resolver: QrMutationsResolver;
  let commandBus: jest.Mocked<CommandBus>;
  let mutationResponseGraphQLMapper: jest.Mocked<MutationResponseGraphQLMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    mutationResponseGraphQLMapper = {
      toResponseDto: jest.fn(),
    } as unknown as jest.Mocked<MutationResponseGraphQLMapper>;

    resolver = new QrMutationsResolver(
      commandBus,
      mutationResponseGraphQLMapper,
    );
  });

  it('qrRegenerate dispatches RegenerateQrCommand', async () => {
    commandBus.execute.mockResolvedValueOnce(undefined);
    mutationResponseGraphQLMapper.toResponseDto.mockReturnValueOnce({
      success: true,
      message: 'QR regenerated',
      id: QR_ID,
    });

    const input: QrRegenerateRequestDto = { id: QR_ID };
    const result = await resolver.qrRegenerate(input);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(RegenerateQrCommand),
    );
    expect(result.id).toBe(QR_ID);
  });
});
