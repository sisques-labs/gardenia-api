import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';

import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import { TenantProvisioningUnavailableException } from '@contexts/spaces/domain/exceptions/tenant-provisioning-unavailable.exception';
import { IMembershipReadRepository } from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import { ISpaceWriteRepository } from '@contexts/spaces/domain/repositories/write/space-write.repository';
import { ITenantProvisioningPort } from '@contexts/spaces/application/ports/tenant-provisioning.port';

import { CreateSpaceCommand } from './create-space.command';
import { CreateSpaceCommandHandler } from './create-space.handler';

const OWNER_ID = '550e8400-e29b-41d4-a716-446655440001';
const SPACE_NAME = 'My Space';
const PLATFORM_ACCESS_TOKEN = 'platform-raw-bearer-token';
const PLATFORM_TENANT_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

describe('CreateSpaceCommandHandler', () => {
  let handler: CreateSpaceCommandHandler;
  let membershipReadRepository: jest.Mocked<IMembershipReadRepository>;
  let spaceWriteRepository: jest.Mocked<ISpaceWriteRepository>;
  let tenantProvisioningPort: jest.Mocked<ITenantProvisioningPort>;
  let configService: jest.Mocked<ConfigService>;
  let eventBus: jest.Mocked<EventBus>;
  let spaceBuilder: SpaceBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    membershipReadRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findByUserAndSpace: jest.fn(),
      countByOwner: jest.fn(),
    } as jest.Mocked<IMembershipReadRepository>;

    spaceWriteRepository = {
      findById: jest.fn(),
      findByCriteria: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<ISpaceWriteRepository>;

    tenantProvisioningPort = {
      createTenant: jest.fn(),
      addMember: jest.fn(),
      removeMember: jest.fn(),
    } as jest.Mocked<ITenantProvisioningPort>;

    configService = {
      getOrThrow: jest.fn().mockReturnValue(5),
    } as unknown as jest.Mocked<ConfigService>;

    eventBus = {
      publish: jest.fn(),
      publishAll: jest.fn(),
    } as unknown as jest.Mocked<EventBus>;

    spaceBuilder = new SpaceBuilder();

    handler = new CreateSpaceCommandHandler(
      membershipReadRepository,
      spaceWriteRepository,
      tenantProvisioningPort,
      configService,
      spaceBuilder,
      eventBus,
    );
  });

  describe('happy path', () => {
    it('should create and save a space when under the cap', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(2);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      const spaceId = await handler.execute(
        new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      expect(typeof spaceId).toBe('string');
      expect(spaceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('should publish events after saving', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(
        new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
      );

      expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    });

    it('should check cap before saving', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(5);
      configService.getOrThrow.mockReturnValue(5);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);

      expect(spaceWriteRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('cap enforcement', () => {
    it('should throw SpaceLimitExceededException when at the cap', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(5);
      configService.getOrThrow.mockReturnValue(5);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);
    });

    it('should read maxSpacesPerUser from spaces config', async () => {
      configService.getOrThrow.mockReturnValue(3);
      handler = new CreateSpaceCommandHandler(
        membershipReadRepository,
        spaceWriteRepository,
        tenantProvisioningPort,
        configService,
        spaceBuilder,
        eventBus,
      );
      membershipReadRepository.countByOwner.mockResolvedValue(3);

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);

      expect(configService.getOrThrow).toHaveBeenCalledWith(
        'spaces.maxSpacesPerUser',
      );
    });
  });

  describe('repository failure', () => {
    it('should propagate errors from save', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(
        handler.execute(
          new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
        ),
      ).rejects.toThrow('DB error');
    });
  });

  describe('native fallback path (no platform token)', () => {
    it('should never call the tenant provisioning port', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(
        new CreateSpaceCommand({ ownerId: OWNER_ID, name: SPACE_NAME }),
      );

      expect(tenantProvisioningPort.createTenant).not.toHaveBeenCalled();
    });

    it('should still generate a locally-random space id when platformAccessToken is explicitly null', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      const spaceId = await handler.execute(
        new CreateSpaceCommand({
          ownerId: OWNER_ID,
          name: SPACE_NAME,
          platformAccessToken: null,
        }),
      );

      expect(tenantProvisioningPort.createTenant).not.toHaveBeenCalled();
      expect(spaceId).not.toBe(PLATFORM_TENANT_ID);
    });
  });

  describe('platform-linked path (D6/D7 — tenant-id parity)', () => {
    it('should provision a tenant via the port and adopt its id verbatim as the space id', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      tenantProvisioningPort.createTenant.mockResolvedValue(PLATFORM_TENANT_ID);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      const spaceId = await handler.execute(
        new CreateSpaceCommand({
          ownerId: OWNER_ID,
          name: SPACE_NAME,
          platformAccessToken: PLATFORM_ACCESS_TOKEN,
        }),
      );

      expect(tenantProvisioningPort.createTenant).toHaveBeenCalledWith(
        PLATFORM_ACCESS_TOKEN,
        { name: SPACE_NAME },
      );
      expect(spaceId).toBe(PLATFORM_TENANT_ID);
    });

    it('should relay a DIFFERENT token/name and adopt a DIFFERENT tenant id (triangulation)', async () => {
      const otherToken = 'another-platform-token';
      const otherName = 'Another Space';
      const otherTenantId = 'a1b2c3d4-e5f6-4789-a123-456789abcdef';
      membershipReadRepository.countByOwner.mockResolvedValue(1);
      tenantProvisioningPort.createTenant.mockResolvedValue(otherTenantId);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      const spaceId = await handler.execute(
        new CreateSpaceCommand({
          ownerId: OWNER_ID,
          name: otherName,
          platformAccessToken: otherToken,
        }),
      );

      expect(tenantProvisioningPort.createTenant).toHaveBeenCalledWith(
        otherToken,
        { name: otherName },
      );
      expect(spaceId).toBe(otherTenantId);
      expect(spaceId).not.toBe(PLATFORM_TENANT_ID);
    });

    it('should save a space whose aggregate id equals the returned tenant id', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      tenantProvisioningPort.createTenant.mockResolvedValue(PLATFORM_TENANT_ID);
      spaceWriteRepository.save.mockResolvedValue(undefined as any);

      await handler.execute(
        new CreateSpaceCommand({
          ownerId: OWNER_ID,
          name: SPACE_NAME,
          platformAccessToken: PLATFORM_ACCESS_TOKEN,
        }),
      );

      expect(spaceWriteRepository.save).toHaveBeenCalledTimes(1);
      const savedSpace = spaceWriteRepository.save.mock.calls[0][0];
      expect(savedSpace.id.value).toBe(PLATFORM_TENANT_ID);
    });

    it('should fail Space creation explicitly when tenant provisioning is unavailable, without saving anything', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(0);
      tenantProvisioningPort.createTenant.mockRejectedValue(
        new TenantProvisioningUnavailableException('HTTP 503'),
      );

      await expect(
        handler.execute(
          new CreateSpaceCommand({
            ownerId: OWNER_ID,
            name: SPACE_NAME,
            platformAccessToken: PLATFORM_ACCESS_TOKEN,
          }),
        ),
      ).rejects.toThrow(TenantProvisioningUnavailableException);

      expect(spaceWriteRepository.save).not.toHaveBeenCalled();
    });

    it('should check the space cap BEFORE calling the tenant provisioning port', async () => {
      membershipReadRepository.countByOwner.mockResolvedValue(5);
      configService.getOrThrow.mockReturnValue(5);

      await expect(
        handler.execute(
          new CreateSpaceCommand({
            ownerId: OWNER_ID,
            name: SPACE_NAME,
            platformAccessToken: PLATFORM_ACCESS_TOKEN,
          }),
        ),
      ).rejects.toThrow(SpaceLimitExceededException);

      expect(tenantProvisioningPort.createTenant).not.toHaveBeenCalled();
    });
  });
});
