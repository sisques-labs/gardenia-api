export class RemoveMemberCommand {
  constructor(
    public readonly spaceId: string,
    public readonly requestingUserId: string,
    public readonly targetUserId: string,
  ) {}
}
