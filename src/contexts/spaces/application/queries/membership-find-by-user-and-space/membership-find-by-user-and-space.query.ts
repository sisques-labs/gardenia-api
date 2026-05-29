export class MembershipFindByUserAndSpaceQuery {
  constructor(
    public readonly userId: string,
    public readonly spaceId: string,
  ) {}
}
