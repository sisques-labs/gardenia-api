import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { LinkExternalSubjectCommand } from '@contexts/auth/application/commands/link-external-subject/link-external-subject.command';
import {
  ISpaceProvisioningPort,
  SPACE_PROVISIONING_PORT,
} from '@contexts/auth/application/ports/space-provisioning.port';
import {
  IUserProvisioningPort,
  USER_PROVISIONING_PORT,
} from '@contexts/auth/application/ports/user-provisioning.port';
import { AccountBuilder } from '@contexts/auth/domain/builders/account.builder';
import { AppRoleEnum } from '@contexts/auth/domain/enums/app-role.enum';
import {
  ACCOUNT_WRITE_REPOSITORY,
  IAccountWriteRepository,
} from '@contexts/auth/domain/repositories/write/account-write.repository';
import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { UuidValueObject } from '@sisques-labs/nestjs-kit';
import { SpaceContext } from '@shared/space-context/space-context.service';
import * as bcrypt from 'bcrypt';

export interface SisquesAccountPrincipalInput {
  externalSubject: string;
  email: string;
}

export interface SisquesAccountPrincipal {
  userId: string;
  email: string;
  appRole: AppRoleEnum;
}

/**
 * Resolves a platform (Sisques Account) subject to a local `userId`/`appRole`
 * pair, driving first-link (by verified email) and auto-provisioning.
 * Mirrors `LoginWithOAuthCommandHandler`'s find-or-create shape, but MUST
 * create an `accounts` row for auto-provisioned users (unlike pure native
 * OAuth signups) so per-request appRole resolution (app-rbac) has a
 * projection row to read (D5).
 */
@Injectable()
export class SisquesAccountPrincipalResolver {
  constructor(
    @Inject(ACCOUNT_WRITE_REPOSITORY)
    private readonly accountRepo: IAccountWriteRepository,
    private readonly accountBuilder: AccountBuilder,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    @Inject(SPACE_PROVISIONING_PORT)
    private readonly spaceProvisioningPort: ISpaceProvisioningPort,
    @Inject(USER_PROVISIONING_PORT)
    private readonly userProvisioningPort: IUserProvisioningPort,
    private readonly spaceContext: SpaceContext,
  ) {}

  async resolve(
    input: SisquesAccountPrincipalInput,
  ): Promise<SisquesAccountPrincipal> {
    const alreadyLinked = await this.accountRepo.findByExternalSubject(
      input.externalSubject,
    );
    if (alreadyLinked) {
      return this.toPrincipal(alreadyLinked);
    }

    const existingByEmail = await this.accountRepo.findByEmail(input.email);
    if (existingByEmail) {
      const linkedAccount = await this.commandBus.execute<
        LinkExternalSubjectCommand,
        AccountAggregate
      >(
        new LinkExternalSubjectCommand({
          email: input.email,
          externalSubject: input.externalSubject,
        }),
      );
      return this.toPrincipal(linkedAccount);
    }

    return this.provisionNewAccount(input);
  }

  private async provisionNewAccount(
    input: SisquesAccountPrincipalInput,
  ): Promise<SisquesAccountPrincipal> {
    const userId = UuidValueObject.generate().value;
    const accountId = UuidValueObject.generate().value;
    // Platform-only accounts never authenticate via password — generate an
    // unusable random hash purely to satisfy the (still NOT NULL, P3-scoped)
    // passwordHash column.
    const unusablePasswordHash = await bcrypt.hash(
      UuidValueObject.generate().value,
      10,
    );

    const spaceId = await this.spaceProvisioningPort.createDefaultSpace({
      ownerId: userId,
      name: `${input.email}'s Space`,
    });

    const now = new Date();
    const account = this.accountBuilder
      .withId(accountId)
      .withUserId(userId)
      .withEmail(input.email)
      .withPasswordHash(unusablePasswordHash)
      .withAppRole(AppRoleEnum.USER)
      .withExternalSubject(input.externalSubject)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    account.create();

    // The tenant-scoped write repository requires an active SpaceContext
    // (it injects space_id from ALS on save) — the account row must be
    // written inside the same run() as the user record, not after it exits.
    await this.spaceContext.run(spaceId, async () => {
      await this.userProvisioningPort.createUser(userId);
      await this.accountRepo.save(account);
    });

    await this.eventBus.publishAll(account.getUncommittedEvents());
    account.commit();

    return this.toPrincipal(account);
  }

  private toPrincipal(account: AccountAggregate): SisquesAccountPrincipal {
    return {
      userId: account.userId.value,
      email: account.email.value,
      appRole: account.appRole.value as AppRoleEnum,
    };
  }
}
