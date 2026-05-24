export class AccountCreatedEvent {
  constructor(
    public readonly accountId: string,
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
