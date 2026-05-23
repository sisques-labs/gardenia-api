export const USER_READ_REPOSITORY = Symbol('USER_READ_REPOSITORY');

export interface UserViewModel {
  id: string;
  email: string;
  createdAt: Date;
}

export interface IUserReadRepository {
  findById(id: string): Promise<UserViewModel | null>;
}
