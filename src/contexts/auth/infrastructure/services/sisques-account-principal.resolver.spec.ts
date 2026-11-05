import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import { IAccountWriteRepository } from '@contexts/auth/domain/repositories/write/account-write.repository';
import { ISpaceProvisioningPort } from '@contexts/auth/application/ports/space-provisioning.port';
import { IUserProvisioningPort } from '@contexts/auth/application/ports/user-provisioning.port';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { SpaceContext } from '@shared/space-context/space-context.service';

import { LinkExternalSubjectCommand } from '@contexts/auth/application/commands/link-external-subject/link-external-subject.command';
import { SisquesAccountPrincipalResolver } from './sisques-account-principal.resolver';

const SUBJECT = 'platform-subject-abc';
const EMAIL = 'user@example.com';
const USER_ID = '550e8400-e29b-41d4-a716-446655440002';
const ACCOUNT_ID = '550e8400-e29b-41d4-a716-446655440001';
const PASSWORD_HASH =
  '$2b$10$abcdefghijklmnopqrstuvwxyz012345678901234567890123456';
const NOW = new Date('2024-01-01T00:00:00.000Z');

const buildAccount = (
  overrides: { appRole?: string; externalSubject?: string | null } = {},
): AccountAggregate =>
  new AccountBuilder()
    .withId(ACCOUNT_ID)
    .withUserId(USER_ID)
    .withEmail(EMAIL)
    .withPasswordHash(PASSWORD_HASH)
    .withAppRole(overrides.appRole ?? AppRoleEnum.ADMIN)
    .withExternalSubject(overrides.externalSubject ?? null)
    .withCreatedAt(NOW)
    .withUpdatedAt(NOW)
    .build();

describe('SisquesAccountPrincipalResolver', () => {
  let resolver: SisquesAccountPrincipalResolver;
  let accountRepo: jest.Mocked<IAccountWriteRepository>;
  let accountBuilder: AccountBuilder;
  let commandBus: jest.Mocked<CommandBus>;
  let eventBus: jest.Mocked<EventBus>;
  let spaceProvisioningPort: jest.Mocked<ISpaceProvisioningPort>;
  let userProvisioningPort: jest.Mocked<IUserProvisioningPort>;
  let spaceContext: jest.Mocked<SpaceContext>;

  beforeEach(() => {
    accountRepo = {
      findByEmail: jest.fn(),
      findByUserId: jest.fn(),
      findByExternalSubject: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findById: jest.fn(),
      findByCriteria: jest.fn(),
    } as unknown as jest.Mocked<IAccountWriteRepository>;

    accountBuilder = new AccountBuilder();

    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;
    eventBus = {
      publishAll: jest.fn(),
      publish: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    spaceProvisioningPort = {
      createDefaultSpace: jest.fn().mockResolvedValue('space-id-123'),
    } as unknown as jest.Mocked<ISpaceProvisioningPort>;

    userProvisioningPort = {
      createUser: jest.fn().mockResolvedValue(undefined),
      deleteUser: jest.fn(),
    } as unknown as jest.Mocked<IUserProvisioningPort>;

    spaceContext = {
      run: jest.fn((_spaceId: string, fn: () => Promise<void>) => fn()),
    } as unknown as jest.Mocked<SpaceContext>;

    resolver = new SisquesAccountPrincipalResolver(
      accountRepo,
      accountBuilder,
      commandBus,
      eventBus,
      spaceProvisioningPort,
      userProvisioningPort,
      spaceContext,
    );
  });

  describe('already-linked subject', () => {
    it('resolves directly without linking or provisioning', async () => {
      const linkedAccount = buildAccount({ externalSubject: SUBJECT });
      accountRepo.findByExternalSubject.mockResolvedValue(linkedAccount);

      const principal = await resolver.resolve({
        externalSubject: SUBJECT,
        email: EMAIL,
      });

      expect(principal).toEqual({
        userId: USER_ID,
        email: EMAIL,
        appRole: AppRoleEnum.ADMIN,
      });
      expect(commandBus.execute).not.toHaveBeenCalled();
      expect(spaceProvisioningPort.createDefaultSpace).not.toHaveBeenCalled();
    });
  });

  describe('first-link by verified email', () => {
    it('dispatches LinkExternalSubjectCommand and resolves from the linked account', async () => {
      accountRepo.findByExternalSubject.mockResolvedValue(null);
      const existingAccount = buildAccount({ appRole: AppRoleEnum.USER });
      const linkedAccount = buildAccount({
        appRole: AppRoleEnum.USER,
        externalSubject: SUBJECT,
      });
      accountRepo.findByEmail.mockResolvedValue(existingAccount);
      commandBus.execute.mockResolvedValue(linkedAccount);

      const principal = await resolver.resolve({
        externalSubject: SUBJECT,
        email: EMAIL,
      });

      expect(commandBus.execute).toHaveBeenCalledWith(
        expect.any(LinkExternalSubjectCommand),
      );
      const dispatchedCommand = commandBus.execute.mock
        .calls[0][0] as LinkExternalSubjectCommand;
      expect(dispatchedCommand.email.value).toBe(EMAIL);
      expect(dispatchedCommand.externalSubject.value).toBe(SUBJECT);
      expect(principal).toEqual({
        userId: USER_ID,
        email: EMAIL,
        appRole: AppRoleEnum.USER,
      });
    });
  });

  describe('auto-provisioning', () => {
    it('provisions a new account with appRole USER and a default space', async () => {
      accountRepo.findByExternalSubject.mockResolvedValue(null);
      accountRepo.findByEmail.mockResolvedValue(null);
      accountRepo.save.mockImplementation(async (a) => a);

      const principal = await resolver.resolve({
        externalSubject: SUBJECT,
        email: 'new-user@example.com',
      });

      expect(principal.email).toBe('new-user@example.com');
      expect(principal.appRole).toBe(AppRoleEnum.USER);
      expect(principal.userId).toEqual(expect.any(String));
      expect(spaceProvisioningPort.createDefaultSpace).toHaveBeenCalledWith({
        ownerId: principal.userId,
        name: "new-user@example.com's Space",
      });
      expect(userProvisioningPort.createUser).toHaveBeenCalledWith(
        principal.userId,
      );
      expect(accountRepo.save).toHaveBeenCalledTimes(1);
    });

    it('persists the new account with the external_subject set at creation time', async () => {
      accountRepo.findByExternalSubject.mockResolvedValue(null);
      accountRepo.findByEmail.mockResolvedValue(null);
      let savedAccount: AccountAggregate | undefined;
      accountRepo.save.mockImplementation(async (a) => {
        savedAccount = a;
        return a;
      });

      await resolver.resolve({
        externalSubject: SUBJECT,
        email: 'new-user@example.com',
      });

      expect(savedAccount?.externalSubject?.value).toBe(SUBJECT);
    });
  });
});
