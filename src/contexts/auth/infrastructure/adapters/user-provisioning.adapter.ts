import { IUserProvisioningPort } from '@contexts/auth/application/ports/user-provisioning.port';
import { CreateUserCommand } from '@contexts/users/application/commands/create-user/create-user.command';
import { DeleteUserCommand } from '@contexts/users/application/commands/delete-user/delete-user.command';
import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';

@Injectable()
export class UserProvisioningAdapter implements IUserProvisioningPort {
  private readonly logger = new Logger(UserProvisioningAdapter.name);

  constructor(private readonly commandBus: CommandBus) {}

  async createUser(userId: string): Promise<void> {
    this.logger.log(`Provisioning user ${userId}`);

    await this.commandBus.execute(new CreateUserCommand(userId));
  }

  async deleteUser(userId: string): Promise<void> {
    this.logger.log(`Deprovisioning user ${userId}`);

    await this.commandBus.execute(new DeleteUserCommand({ id: userId }));
  }
}
