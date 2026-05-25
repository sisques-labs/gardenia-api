import { LoginAccountCommand } from '@contexts/auth/application/commands/login-account/login-account.command';
import { ValidateAccountCredentialsService } from '@contexts/auth/application/services/read/validate-account-credentials/validate-account-credentials.service';
import { TokenService } from '@contexts/auth/application/services/token.service';
import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { InvalidCredentialsException } from '@contexts/auth/domain/exceptions/invalid-credentials.exception';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';

@CommandHandler(LoginAccountCommand)
export class LoginAccountCommandHandler
  extends BaseCommandHandler<LoginAccountCommand, AccountAggregate>
  implements ICommandHandler<LoginAccountCommand>
{
  constructor(
    eventBus: EventBus,
    private readonly tokenService: TokenService,
    private readonly validateAccountCredentialsService: ValidateAccountCredentialsService,
  ) {
    super(eventBus);
  }

  async execute(
    command: LoginAccountCommand,
  ): Promise<{ accessToken: string }> {
    const account = await this.validateAccountCredentialsService.execute(
      command.email.value,
      command.password.value,
    );

    if (!account) {
      throw new InvalidCredentialsException();
    }

    return {
      accessToken: this.tokenService.sign(
        account.userId.value,
        account.email.value,
      ),
    };
  }
}
