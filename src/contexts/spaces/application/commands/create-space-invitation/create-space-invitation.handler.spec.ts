import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

import { ISpaceQrPort } from '@contexts/spaces/application/ports/space-qr.port';
import { AssertSpaceExistsService } from '@contexts/spaces/application/services/write/assert-space-exists/assert-space-exists.service';
import { AssertUserIsSpaceMemberService } from '@contexts/spaces/application/services/write/assert-user-is-space-member/assert-user-is-space-member.service';
import { AssertUserIsSpaceOwnerService } from '@contexts/spaces/application/services/write/assert-user-is-space-owner/assert-user-is-space-owner.service';
import { GenerateUniqueInvitationCodeService } from '@contexts/spaces/application/services/write/generate-unique-invitation-code/generate-unique-invitation-code.service';
import { SpaceInvitationTargetUrlBuilderService } from '@contexts/spaces/application/services/write/space-invitation-target-url-builder/space-invitation-target-url-builder.service';
import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceInvitationBuilder } from '@contexts/spaces/domain/builders/space-invitation.builder';
import { ISpaceInvitationWriteRepository } from '@contexts/spaces/domain/repositories/write/space-invitation-write.repository';
import { CreateSpaceInvitationCommand } from './create-space-invitation.command';
import { CreateSpaceInvitationCommandHandler } from './create-space-invitation.handler';

const SPACE_ID = '770e8400-e29b-41d4-a716-446655440002';
const USER_ID = '660e8400-e29b-41d4-a716-446655440001';
const QR_ID = '990e8400-e29b-41d4-a716-446655440004';

describe('CreateSpaceInvitationCommandHandler', () => {
  let handler: CreateSpaceInvitationCommandHandler;
  let writeRepository: jest.Mocked<ISpaceInvitationWriteRepository>;
  let assertSpaceExists: jest.Mocked<AssertSpaceExistsService>;
  let assertIsMember: jest.Mocked<AssertUserIsSpaceMemberService>;
  let assertIsOwner: jest.Mocked<AssertUserIsSpaceOwnerService>;
  let generateCode: jest.Mocked<GenerateUniqueInvitationCodeService>;
  let targetUrlBuilder: jest.Mocked<SpaceInvitationTargetUrlBuilderService>;
  let spaceQrPort: jest.Mocked<ISpaceQrPort>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    jest.clearAllMocks();

    writeRepository = {
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<ISpaceInvitationWriteRepository>;

    const space = { name: { value: 'My garden' } } as SpaceAggregate;
    assertSpaceExists = {
      execute: jest.fn().mockResolvedValue(space),
    } as unknown as jest.Mocked<AssertSpaceExistsService>;
    assertIsMember = {
      execute: jest.fn().mockResolvedValue({ role: { isOwner: () => true } }),
    } as unknown as jest.Mocked<AssertUserIsSpaceMemberService>;
    assertIsOwner = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AssertUserIsSpaceOwnerService>;
    generateCode = {
      execute: jest
        .fn()
        .mockResolvedValue({ code: 'SECRETCODE', displayCode: 'ABC-123' }),
    } as unknown as jest.Mocked<GenerateUniqueInvitationCodeService>;
    targetUrlBuilder = {
      execute: jest.fn().mockResolvedValue('https://example.com/i/ABC-123'),
    } as unknown as jest.Mocked<SpaceInvitationTargetUrlBuilderService>;
    spaceQrPort = {
      createInvitationQr: jest.fn().mockResolvedValue(QR_ID),
    } as unknown as jest.Mocked<ISpaceQrPort>;
    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    const configService = {
      getOrThrow: jest.fn().mockReturnValue(72),
    } as unknown as ConfigService;

    handler = new CreateSpaceInvitationCommandHandler(
      writeRepository,
      assertSpaceExists,
      assertIsMember,
      assertIsOwner,
      generateCode,
      targetUrlBuilder,
      spaceQrPort,
      new SpaceInvitationBuilder(),
      configService,
      eventBus,
    );
  });

  const command = (): CreateSpaceInvitationCommand =>
    new CreateSpaceInvitationCommand({
      spaceId: SPACE_ID,
      requestingUserId: USER_ID,
    });

  it('creates the invitation, persists it and returns its view model', async () => {
    const result = await handler.execute(command());

    expect(generateCode.execute).toHaveBeenCalledWith({
      spaceName: 'My garden',
    });
    expect(targetUrlBuilder.execute).toHaveBeenCalledWith({
      displayCode: 'ABC-123',
    });
    expect(spaceQrPort.createInvitationQr).toHaveBeenCalledTimes(1);
    expect(writeRepository.save).toHaveBeenCalledTimes(1);
    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);

    expect(result.spaceId).toBe(SPACE_ID);
    expect(result.displayCode).toBe('ABC-123');
    expect(result.code).toBe('SECRETCODE');
    expect(result.qrId).toBe(QR_ID);
    expect(result.role).toBe('member');
  });

  it('does not create the invitation when the requester is not the owner', async () => {
    assertIsOwner.execute.mockRejectedValue(new Error('not owner'));

    await expect(handler.execute(command())).rejects.toThrow('not owner');
    expect(spaceQrPort.createInvitationQr).not.toHaveBeenCalled();
    expect(writeRepository.save).not.toHaveBeenCalled();
  });
});
