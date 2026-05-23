import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';

import { GetCurrentUserQuery } from '@contexts/users/application/queries/get-current-user/get-current-user.query';
import { UserViewModel } from '@contexts/users/domain/repositories/i-user-read.repository';
import { TokenService } from '../../services/token.service';
import { LoginUserCommand } from './login-user.command';

export interface AuthPayload {
  accessToken: string;
  user: UserViewModel | null;
}

@CommandHandler(LoginUserCommand)
export class LoginUserCommandHandler
  implements ICommandHandler<LoginUserCommand>
{
  constructor(
    private readonly tokenService: TokenService,
    private readonly queryBus: QueryBus,
  ) {}

  async execute(command: LoginUserCommand): Promise<AuthPayload> {
    const accessToken = this.tokenService.sign(command.userId, command.email);

    const user = await this.queryBus.execute<
      GetCurrentUserQuery,
      UserViewModel | null
    >(new GetCurrentUserQuery(command.userId));

    return { accessToken, user };
  }
}
