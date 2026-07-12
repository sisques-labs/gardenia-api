import { EventBus } from '@nestjs/cqrs';

import { AssertBridgeExistsService } from '@contexts/nodes/application/services/write/assert-bridge-exists/assert-bridge-exists.service';
import { BridgeBuilder } from '@contexts/nodes/domain/builders/bridge.builder';
import { BridgeAlreadyClaimedException } from '@contexts/nodes/domain/exceptions/bridge-already-claimed.exception';
import { InvalidPairingCodeException } from '@contexts/nodes/domain/exceptions/invalid-pairing-code.exception';
import { BridgeStatusEnum } from '@contexts/nodes/domain/enums/bridge-status.enum';
import { IBridgeWriteRepository } from '@contexts/nodes/domain/repositories/write/bridge-write.repository';

import { ClaimBridgeCommand } from './claim-bridge.command';
import { ClaimBridgeCommandHandler } from './claim-bridge.handler';

const BRIDGE_ID = '550e8400-e29b-41d4-a716-446655440000';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440001';

function buildUnclaimedBridge(code = 'GRDN-AAAA') {
  return new BridgeBuilder()
    .withId(BRIDGE_ID)
    .withStatus(BridgeStatusEnum.UNCLAIMED)
    .withPairingCode(code)
    .withCreatedAt(new Date())
    .withUpdatedAt(new Date())
    .build();
}

describe('ClaimBridgeCommandHandler', () => {
  let handler: ClaimBridgeCommandHandler;
  let writeRepository: jest.Mocked<IBridgeWriteRepository>;
  let eventBus: jest.Mocked<EventBus>;
  let assertBridgeExistsService: jest.Mocked<AssertBridgeExistsService>;

  beforeEach(() => {
    writeRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn().mockImplementation((agg) => Promise.resolve(agg)),
      delete: jest.fn(),
    } as jest.Mocked<IBridgeWriteRepository>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    assertBridgeExistsService = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<AssertBridgeExistsService>;

    handler = new ClaimBridgeCommandHandler(
      writeRepository,
      assertBridgeExistsService,
      eventBus,
    );
  });

  it('claims the bridge with a valid code', async () => {
    assertBridgeExistsService.execute.mockResolvedValue(buildUnclaimedBridge());

    await handler.execute(
      new ClaimBridgeCommand({
        bridgeId: BRIDGE_ID,
        pairingCode: 'GRDN-AAAA',
        spaceId: SPACE_ID,
      }),
    );

    expect(writeRepository.save).toHaveBeenCalledTimes(1);
    const saved = writeRepository.save.mock.calls[0][0];
    expect(saved.status.value).toBe(BridgeStatusEnum.ACTIVE);
    expect(saved.spaceId!.value).toBe(SPACE_ID);
  });

  it('throws InvalidPairingCodeException for a wrong code', async () => {
    assertBridgeExistsService.execute.mockResolvedValue(buildUnclaimedBridge());

    await expect(
      handler.execute(
        new ClaimBridgeCommand({
          bridgeId: BRIDGE_ID,
          pairingCode: 'GRDN-ZZZZ',
          spaceId: SPACE_ID,
        }),
      ),
    ).rejects.toThrow(InvalidPairingCodeException);
  });

  it('throws BridgeAlreadyClaimedException for an already-active bridge', async () => {
    const active = new BridgeBuilder()
      .withId(BRIDGE_ID)
      .withStatus(BridgeStatusEnum.ACTIVE)
      .withSpaceId(SPACE_ID)
      .withCreatedAt(new Date())
      .withUpdatedAt(new Date())
      .build();
    assertBridgeExistsService.execute.mockResolvedValue(active);

    await expect(
      handler.execute(
        new ClaimBridgeCommand({
          bridgeId: BRIDGE_ID,
          pairingCode: 'GRDN-AAAA',
          spaceId: SPACE_ID,
        }),
      ),
    ).rejects.toThrow(BridgeAlreadyClaimedException);
  });
});
