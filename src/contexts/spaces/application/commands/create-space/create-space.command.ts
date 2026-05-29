export class CreateSpaceCommand {
  constructor(
    public readonly ownerId: string,
    public readonly name: string,
  ) {}
}
