export type ChangePasswordCommandInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

export class ChangePasswordCommand {
  public readonly userId: string;
  public readonly currentPassword: string;
  public readonly newPassword: string;

  constructor(input: ChangePasswordCommandInput) {
    this.userId = input.userId;
    this.currentPassword = input.currentPassword;
    this.newPassword = input.newPassword;
  }
}
