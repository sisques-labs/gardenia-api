export const QR_PNG_GENERATOR = Symbol('QR_PNG_GENERATOR');

export interface IQrPngGenerator {
  generate(targetUrl: string): Promise<Buffer>;
}
