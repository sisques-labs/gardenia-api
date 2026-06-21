import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  IssueApiTokenCommand,
  IssueApiTokenCommandInput,
} from '@contexts/auth/application/commands/issue-api-token/issue-api-token.command';
import { IssueApiTokenResult } from '@contexts/auth/application/commands/issue-api-token/issue-api-token.handler';
import { RevokeApiTokenCommand } from '@contexts/auth/application/commands/revoke-api-token/revoke-api-token.command';
import { ApiTokenFindByUserQuery } from '@contexts/auth/application/queries/api-token-find-by-user/api-token-find-by-user.query';
import { ApiTokenViewModel } from '@contexts/auth/domain/view-models/api-token.view-model';
import {
  CurrentUser,
  CurrentUserPayload,
} from '@contexts/auth/infrastructure/decorators/current-user.decorator';
import { IdentityOnly } from '@shared/decorators/identity-only.decorator';

import { ApiTokenResponseDto } from '../dtos/api-token-response.dto';
import { IssueApiTokenResponseDto } from '../dtos/issue-api-token-response.dto';
import { IssueApiTokenDto } from '../dtos/issue-api-token.dto';

/**
 * Manages long-lived, space-scoped API tokens (e.g. for the Home Assistant
 * MCP client). Issuance is space-scoped (X-Space-ID required, membership
 * enforced by SpaceGuard); listing/revocation are identity-only.
 */
@ApiTags('auth')
@ApiBearerAuth()
@Controller('auth/api-tokens')
export class ApiTokenController {
  private readonly logger = new Logger(ApiTokenController.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue an API token scoped to the current space' })
  @ApiResponse({ status: 201, type: IssueApiTokenResponseDto })
  async issue(
    @Body() dto: IssueApiTokenDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('x-space-id') spaceId: string,
  ): Promise<IssueApiTokenResponseDto> {
    this.logger.log(
      `Issuing API token "${dto.label}" for user ${user.userId} in space ${spaceId}`,
    );

    const result = await this.commandBus.execute<
      IssueApiTokenCommand,
      IssueApiTokenResult
    >(
      new IssueApiTokenCommand({
        userId: user.userId,
        spaceId,
        label: dto.label,
      } satisfies IssueApiTokenCommandInput),
    );

    return { id: result.id, token: result.token };
  }

  @Get()
  @IdentityOnly()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "List the current user's API tokens" })
  @ApiResponse({ status: 200, type: [ApiTokenResponseDto] })
  async list(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<ApiTokenResponseDto[]> {
    this.logger.log(`Listing API tokens for user ${user.userId}`);

    const tokens = await this.queryBus.execute<
      ApiTokenFindByUserQuery,
      ApiTokenViewModel[]
    >(new ApiTokenFindByUserQuery({ userId: user.userId }));

    return tokens.map((token) => this.toResponse(token));
  }

  @Delete(':id')
  @IdentityOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API token' })
  @ApiResponse({ status: 204 })
  async revoke(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<void> {
    this.logger.log(`Revoking API token ${id} for user ${user.userId}`);

    await this.commandBus.execute<RevokeApiTokenCommand, void>(
      new RevokeApiTokenCommand({ tokenId: id, userId: user.userId }),
    );
  }

  private toResponse(token: ApiTokenViewModel): ApiTokenResponseDto {
    return {
      id: token.id,
      label: token.label,
      spaceId: token.spaceId,
      lastUsedAt: token.lastUsedAt,
      revokedAt: token.revokedAt,
      createdAt: token.createdAt,
    };
  }
}
