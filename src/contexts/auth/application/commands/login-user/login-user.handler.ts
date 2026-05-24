import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  QueryBus,
} from '@nestjs/cqrs';

import { AccountAggregate } from '@contexts/auth/domain/aggregates/account.aggregate';
import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/read/user-read.repository';
import { BaseCommandHandler } from '@sisques-labs/nestjs-kit';
import { TokenService } from '../../services/token.service';
import { LoginUserCommand } from './login-user.command';

export interface AuthPayload {
  accessToken: string;
  user: UserViewModel | null;
}

@CommandHandler(LoginUserCommand)
export class LoginUserCommandHandler
  extends BaseCommandHandler<LoginUserCommand, AccountAggregate>
  implements ICommandHandler<LoginUserCommand>
{
  constructor(
    eventBus: EventBus,
    private readonly tokenService: TokenService,
    private readonly queryBus: QueryBus,
  ) {
    super(eventBus);
  }

  async execute(command: LoginUserCommand): Promise<AuthPayload> {
    const accessToken = this.tokenService.sign(
      command.userId.value,
      command.email.value,
    );

    const user = await this.queryBus.execute<
      GetCurrentUserQuery,
      UserViewModel | null
    >(new GetCurrentUserQuery(command.userId.value));

    return { accessToken, user };
  }
}
