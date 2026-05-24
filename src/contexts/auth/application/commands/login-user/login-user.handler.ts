import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';
import { TokenService } from '../../services/token.service';
import { LoginUserCommand } from './login-user.command';

@CommandHandler(LoginUserCommand)
export class LoginUserCommandHandler
  extends BaseCommandHandler<LoginUserCommand, AccountAggregate>
  implements ICommandHandler<LoginUserCommand>
{
  constructor(
    eventBus: EventBus,
    private readonly tokenService: TokenService,
  ) {
    super(eventBus);
  }

  async execute(command: LoginUserCommand): Promise<{ accessToken: string }> {
    const accessToken = this.tokenService.sign(
      command.userId.value,
      command.email.value,
    );

    return { accessToken };
  }
}
