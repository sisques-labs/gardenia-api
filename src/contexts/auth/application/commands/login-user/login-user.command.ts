export class LoginUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
