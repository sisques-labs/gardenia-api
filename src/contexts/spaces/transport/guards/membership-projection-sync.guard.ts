// Design.md D4 — this guard runs IMMEDIATELY BEFORE `SpaceGuard` and only
// ever REFRESHES what `SpaceGuard` will then read from the local membership
// projection. It never makes an allow/deny decision from a JWT claim, and it
// never replaces `SpaceGuard`'s own X-Space-ID + projection lookup — see
// `space.guard.ts`'s Tenant Resolution Policy note, which this guard MUST
// NOT weaken. `SpaceGuard` itself is not modified.

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Reflector } from '@nestjs/core';

import { extractPlatformAccessToken } from '@contexts/auth/infrastructure/decorators/platform-access-token.decorator';
import { SyncSpaceMembershipProjectionCommand } from '@contexts/spaces/application/commands/sync-space-membership-projection/sync-space-membership-projection.command';
import { MembershipFindByUserAndSpaceQuery } from '@contexts/spaces/application/queries/membership-find-by-user-and-space/membership-find-by-user-and-space.query';
import { SpaceMembership } from '@contexts/spaces/domain/entities/space-membership.entity';
import {
  sisquesAccountConfig,
  SisquesAccountConfig,
} from '@core/config/sisques-account.config';

import { IDENTITY_ONLY_KEY } from '../../../../shared/decorators/identity-only.decorator';
import { SKIP_SPACE_KEY } from '../../../../shared/decorators/skip-space.decorator';

const MS_PER_SECOND = 1000;

@Injectable()
export class MembershipProjectionSyncGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    @Inject(sisquesAccountConfig.KEY)
    private readonly config: SisquesAccountConfig,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const skip =
      this.reflector.getAllAndOverride<boolean>(SKIP_SPACE_KEY, targets) ||
      this.reflector.getAllAndOverride<boolean>(IDENTITY_ONLY_KEY, targets);
    if (skip) return true;

    // P2 rollback (design.md "Revert P2" step 1): flip the flag, no code
    // change, and the projection freezes at its last state.
    if (!this.config.spaceTenantSyncEnabled) return true;

    const req = this.getRequest(context);

    const platformAccessToken = extractPlatformAccessToken(
      this.getAuthorizationHeader(req),
    );
    if (!platformAccessToken) return true; // native principal — untouched

    const user = req['user'] as { userId: string } | undefined;
    if (!user) return true; // let JwtAuthGuard/SpaceGuard produce the 401

    const spaceId = this.getSpaceIdHeader(req);
    if (!spaceId) return true; // let SpaceGuard produce the 400

    const existing = await this.queryBus.execute<
      MembershipFindByUserAndSpaceQuery,
      SpaceMembership | null
    >(new MembershipFindByUserAndSpaceQuery({ userId: user.userId, spaceId }));

    if (existing && !this.isStale(existing.syncedAt)) {
      return true;
    }

    const allowed = await this.commandBus.execute<
      SyncSpaceMembershipProjectionCommand,
      boolean
    >(
      new SyncSpaceMembershipProjectionCommand({
        tenantId: spaceId,
        userId: user.userId,
        callerAccessToken: platformAccessToken,
      }),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'Platform membership could not be confirmed for this space',
      );
    }

    return true;
  }

  private isStale(syncedAt: Date | null): boolean {
    if (!syncedAt) return true;
    const ttlMs = this.config.membershipSyncTtlSeconds * MS_PER_SECOND;
    return Date.now() - syncedAt.getTime() > ttlMs;
  }

  private getAuthorizationHeader(
    req: Record<string, unknown>,
  ): string | undefined {
    const headers = req['headers'] as
      Record<string, string | string[] | undefined> | undefined;
    const header = headers?.['authorization'];
    return Array.isArray(header) ? header[0] : header;
  }

  private getSpaceIdHeader(req: Record<string, unknown>): string | undefined {
    const headers = req['headers'] as
      Record<string, string | string[] | undefined> | undefined;
    const spaceId = headers?.['x-space-id'] as string | undefined;
    return spaceId && spaceId.trim() !== '' ? spaceId : undefined;
  }

  private getRequest(context: ExecutionContext): Record<string, unknown> {
    if (context.getType<string>() === 'graphql') {
      return GqlExecutionContext.create(context).getContext<{
        req: Record<string, unknown>;
      }>().req;
    }
    return context.switchToHttp().getRequest<Record<string, unknown>>();
  }
}
