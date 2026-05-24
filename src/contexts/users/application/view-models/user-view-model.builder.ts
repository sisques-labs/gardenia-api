import { UserViewModel } from '../../domain/repositories/i-user-read.repository';

export class UserViewModelBuilder {
  private _id!: string;
  private _email!: string;
  private _createdAt!: Date;

  withId(id: string): this {
    this._id = id;
    return this;
  }

  withEmail(email: string): this {
    this._email = email;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this._createdAt = createdAt;
    return this;
  }

  build(): UserViewModel {
    if (!this._id) throw new Error('UserViewModelBuilder: id is required');
    if (!this._email) throw new Error('UserViewModelBuilder: email is required');
    if (!this._createdAt) throw new Error('UserViewModelBuilder: createdAt is required');

    return {
      id: this._id,
      email: this._email,
      createdAt: this._createdAt,
    };
  }
}
