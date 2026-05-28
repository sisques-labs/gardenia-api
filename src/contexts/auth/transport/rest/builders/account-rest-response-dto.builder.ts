import { BaseBuilder } from '@sisques-labs/nestjs-kit';
import { AccountRestResponseDto } from '@contexts/auth/transport/rest/dtos/account-rest-response.dto';

export class AccountRestResponseDtoBuilder extends BaseBuilder<
  AccountRestResponseDto,
  AccountRestResponseDto
> {
  private _userId!: string;
  private _email!: string;

  withUserId(userId: string): this {
    this._userId = userId;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  build(): AccountRestResponseDto {
    return {
      id: this._id,
      userId: this._userId,
      email: this._email,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  buildViewModel(): AccountRestResponseDto {
    return this.build();
  }
}
