export type ApiTokenFindByUserQueryInput = {
  userId: string;
};

export class ApiTokenFindByUserQuery {
  public readonly userId: string;

  constructor(input: ApiTokenFindByUserQueryInput) {
    this.userId = input.userId;
  }
}
