import { RegisterAccountCommand } from '@contexts/auth/application/commands/register-account/register-account.command';
import {
  ISpaceProvisioningPort,
  SPACE_PROVISIONING_PORT,
} from '@contexts/auth/application/ports/space-provisioning.port';
import {
  IUserProvisioningPort,
  USER_PROVISIONING_PORT,
} from '@contexts/auth/application/ports/user-provisioning.port';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';
import * as bcrypt from 'bcrypt';
import { SpaceContext } from '../../../../../shared/space-context/space-context.service';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountCommandHandler
  extends BaseCommandHandler<RegisterAccountCommand, AccountAggregate>
  implements ICommandHandler<RegisterAccountCommand>
{
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountWriteRepository: IAccountWriteRepository,
    @Inject(SPACE_PROVISIONING_PORT)
    private readonly spaceProvisioningPort: ISpaceProvisioningPort,
    @Inject(USER_PROVISIONING_PORT)
    private readonly userProvisioningPort: IUserProvisioningPort,
    private readonly spaceContext: SpaceContext,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: RegisterAccountCommand): Promise<{ spaceId: string }> {
    const { email, passwordHash } = command;

    // 1. Generate userId upfront so CreateSpaceCommand can use it as ownerId.
    // Email uniqueness per space is enforced by DB UNIQUE(spaceId, email).
    const userId = UuidValueObject.generate().value;

    // 2. Create Space first — SpaceTypeOrmWriteRepository is NOT tenant-scoped.
    const spaceId = await this.spaceProvisioningPort.createDefaultSpace({
      ownerId: userId,
      name: `${email.value}'s Space`,
    });

    // 3. Run everything inside SpaceContext so tenant-wrapped repos accept the writes.
    const id = UuidValueObject.generate().value;
    const now = new Date();
    const hashedPassword = await bcrypt.hash(passwordHash.value, 10);
    const account = new AccountBuilder()
      .withId(id)
      .withUserId(userId)
      .withEmail(email.value)
      .withPasswordHash(hashedPassword)
      .withAppRole(AppRoleEnum.USER)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    await this.spaceContext.run(spaceId, async () => {
      await this.userProvisioningPort.createUser(userId);
      await this.accountWriteRepository.save(account);
    });

    account.create();
    await this.publishEvents(account);

    return { spaceId };
  }
}
