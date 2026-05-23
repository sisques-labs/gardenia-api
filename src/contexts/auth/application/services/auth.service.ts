import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import * as bcrypt from 'bcrypt';

import {
  FindUserByEmailQuery,
  FindUserByEmailResult,
} from '@contexts/users/application/queries/find-user-by-email/index';

@Injectable()
export class AuthService {
  constructor(private readonly queryBus: QueryBus) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<{ id: string; email: string } | null> {
    const result = await this.queryBus.execute<
      FindUserByEmailQuery,
      FindUserByEmailResult
    >(new FindUserByEmailQuery(email));

    if (!result) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, result.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return { id: result.id, email: result.email };
  }
}
