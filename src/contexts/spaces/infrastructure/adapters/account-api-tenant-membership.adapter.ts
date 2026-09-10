import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import { ITenantMembershipQueryPort } from '@contexts/spaces/application/ports/tenant-membership-query.port';
import { TenantMembershipQueryUnavailableException } from '@contexts/spaces/domain/exceptions/tenant-membership-query-unavailable.exception';
import {
  SisquesAccountConfig,
  sisquesAccountConfig,
} from '@core/config/sisques-account.config';

import {
  TenantMemberApiEntry,
  TenantMembersApiResponse,
} from './account-api/types/account-api-tenant.types';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * `GET /v1/tenants/{tenantId}/members` on account-api (design.md D4). Always
 * relays the CALLER'S OWN raw bearer token — read from the `Authorization`
 * header by the (not-yet-implemented) `MembershipProjectionSyncGuard`, never
 * derived from a decoded JWT claim, per the binding tenant-resolution-policy.
 *
 * Return contract: `null` means the platform confirmed the caller is no
 * longer a member (403) — the local projection row MUST be deleted. Any
 * other failure (5xx, timeout, network error) REJECTS instead of returning
 * `null`, so the caller can fail closed only when no fresh row already
 * exists, per the sync mechanism's platform-response table.
 */
@Injectable()
export class AccountApiTenantMembershipAdapter implements ITenantMembershipQueryPort {
  private readonly logger = new Logger(AccountApiTenantMembershipAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(sisquesAccountConfig.KEY)
    private readonly config: SisquesAccountConfig,
  ) {}

  async listMembers(
    tenantId: string,
    callerAccessToken: string,
  ): Promise<Array<{ userId: string; role: string }> | null> {
    this.logger.log(`Fetching platform membership for tenant ${tenantId}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.get<TenantMembersApiResponse>(
          `${this.config.apiUrl}/v1/tenants/${tenantId}/members`,
          {
            headers: { Authorization: `Bearer ${callerAccessToken}` },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      return (data ?? [])
        .map((entry) => this.toMember(entry))
        .filter(
          (member): member is { userId: string; role: string } =>
            member != null,
        );
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError?.response?.status === 403) {
        this.logger.warn(
          `Caller no longer a member of tenant ${tenantId} (403)`,
        );
        return null;
      }
      throw this.mapError(error, tenantId);
    }
  }

  private toMember(
    entry: TenantMemberApiEntry,
  ): { userId: string; role: string } | null {
    if (!entry?.userId || !entry?.role) {
      return null;
    }
    return { userId: entry.userId, role: entry.role };
  }

  private mapError(error: unknown, tenantId: string): Error {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;
    const reason =
      status != null
        ? `HTTP ${status}`
        : axiosError?.message || 'unknown error';

    this.logger.error(
      `Membership fetch failed for tenant ${tenantId}: ${reason}`,
    );
    return new TenantMembershipQueryUnavailableException(reason);
  }
}
