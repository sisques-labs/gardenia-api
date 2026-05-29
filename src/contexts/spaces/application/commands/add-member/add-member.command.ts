export class AddMemberCommand {
  constructor(
    public readonly spaceId: string,
    public readonly requestingUserId: string,
    public readonly targetUserId: string,
  ) {}
}
