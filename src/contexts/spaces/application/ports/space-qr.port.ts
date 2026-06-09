export const SPACE_QR_PORT = Symbol('SPACE_QR_PORT');

export interface CreateInvitationQrInput {
  targetUrl: string;
  spaceId: string;
  expiresAt: Date;
}

export interface ISpaceQrPort {
  createInvitationQr(input: CreateInvitationQrInput): Promise<string>;
}
