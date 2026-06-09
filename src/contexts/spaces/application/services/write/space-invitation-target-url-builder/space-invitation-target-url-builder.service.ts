import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IBaseService } from '@sisques-labs/nestjs-kit';

export interface SpaceInvitationTargetUrlBuilderServiceInput {
  displayCode: string;
}

@Injectable()
export class SpaceInvitationTargetUrlBuilderService implements IBaseService<
  SpaceInvitationTargetUrlBuilderServiceInput,
  string
> {
  private readonly logger = new Logger(
    SpaceInvitationTargetUrlBuilderService.name,
  );

  constructor(private readonly configService: ConfigService) {}

  async execute(
    input: SpaceInvitationTargetUrlBuilderServiceInput,
  ): Promise<string> {
    this.logger.log('Building space invitation QR target URL');

    const baseUrl = this.configService.getOrThrow<string>('app.qrBaseUrl');
    const encoded = encodeURIComponent(input.displayCode);
    return `${baseUrl}/invite?code=${encoded}`;
  }
}
