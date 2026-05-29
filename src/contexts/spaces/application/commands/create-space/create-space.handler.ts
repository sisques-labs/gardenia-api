import { Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler, UuidValueObject } from '@sisques-labs/nestjs-kit';

import { SpaceAggregate } from '@contexts/spaces/domain/aggregates/space.aggregate';
import { SpaceBuilder } from '@contexts/spaces/domain/builders/space.builder';
import { SpaceLimitExceededException } from '@contexts/spaces/domain/exceptions/space-limit-exceeded.exception';
import { MembershipRoleEnum } from '@contexts/spaces/domain/enums/membership-role.enum';
import {
  IMembershipReadRepository,
  MEMBERSHIP_READ_REPOSITORY,
} from '@contexts/spaces/domain/repositories/read/membership-read.repository';
import {
  ISpaceWriteRepository,
  SPACE_WRITE_REPOSITORY,
} from '@contexts/spaces/domain/repositories/write/space-write.repository';

import { CreateSpaceCommand } from './create-space.command';

@CommandHandler(CreateSpaceCommand)
export class CreateSpaceCommandHandler
  extends BaseCommandHandler<CreateSpaceCommand, SpaceAggregate>
  implements ICommandHandler<CreateSpaceCommand, string>
{
  private readonly logger = new Logger(CreateSpaceCommandHandler.name);

  constructor(
    @Inject(MEMBERSHIP_READ_REPOSITORY)
    private readonly membershipReadRepository: IMembershipReadRepository,
    @Inject(SPACE_WRITE_REPOSITORY)
    private readonly spaceWriteRepository: ISpaceWriteRepository,
    private readonly configService: ConfigService,
    private readonly spaceBuilder: SpaceBuilder,
    eventBus: EventBus,
  ) {
    super(eventBus);
  }

  async execute(command: CreateSpaceCommand): Promise<string> {
    const maxSpaces = this.configService.get<number>('MAX_SPACES_PER_USER', 5);
    const ownedCount = await this.membershipReadRepository.countByOwner(
      command.ownerId.value,
    );

    if (ownedCount >= maxSpaces) {
      throw new SpaceLimitExceededException(command.ownerId.value, maxSpaces);
    }

    const now = new Date();
    const space = this.spaceBuilder
      .withId(UuidValueObject.generate().value)
      .withName(command.name.value)
      .withOwnerId(command.ownerId.value)
      .withCreatedAt(now)
      .withUpdatedAt(now)
      .build();

    space.create();
    space.addMember(command.ownerId.value, MembershipRoleEnum.OWNER);

    await this.spaceWriteRepository.save(space);
    await this.publishEvents(space);

    this.logger.log(
      `Space created: ${space.id.value} for owner: ${command.ownerId.value}`,
    );

    return space.id.value;
  }
}
