import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';

import {
  AddTenantMemberInput,
  CreateTenantInput,
  ITenantProvisioningPort,
  TenantMemberConfirmation,
} from '@contexts/spaces/application/ports/tenant-provisioning.port';
import { TenantProvisioningUnavailableException } from '@contexts/spaces/domain/exceptions/tenant-provisioning-unavailable.exception';
import {
  SisquesAccountConfig,
  sisquesAccountConfig,
} from '@core/config/sisques-account.config';

import {
  CreateTenantApiResponse,
  TenantMemberApiEntry,
} from './account-api/types/account-api-tenant.types';

const REQUEST_TIMEOUT_MS = 5000;

/**
 * `POST /v1/tenants` on account-api (design.md D6/D7). Per D7, the ACTING
 * USER'S OWN platform bearer token is relayed — never a service-account
 * credential, since gardenia has no client-credentials path into
 * account-api — so that user becomes the tenant `owner` exactly as
 * account-api's existing model expects.
 */
@Injectable()
export class AccountApiTenantAdapter implements ITenantProvisioningPort {
  private readonly logger = new Logger(AccountApiTenantAdapter.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(sisquesAccountConfig.KEY)
    private readonly config: SisquesAccountConfig,
  ) {}

  async createTenant(
    callerAccessToken: string,
    input: CreateTenantInput,
  ): Promise<string> {
    this.logger.log(`Provisioning platform tenant "${input.name}"`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<CreateTenantApiResponse>(
          `${this.config.apiUrl}/v1/tenants`,
          {
            appId: this.config.appId,
            name: input.name,
            slug: this.toSlug(input.name),
          },
          {
            headers: { Authorization: `Bearer ${callerAccessToken}` },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      if (!data?.id) {
        throw new TenantProvisioningUnavailableException(
          'response missing tenant id',
        );
      }

      this.logger.debug(`Platform tenant provisioned: ${data.id}`);
      return data.id;
    } catch (error) {
      if (error instanceof TenantProvisioningUnavailableException) {
        throw error;
      }
      throw this.mapError(error);
    }
  }

  /**
   * ⚠️ Endpoint shape inferred, not confirmed against account-api source —
   * see `ITenantProvisioningPort`'s doc comment for the design/spec conflict
   * this bridges.
   */
  async addMember(
    callerAccessToken: string,
    tenantId: string,
    input: AddTenantMemberInput,
  ): Promise<TenantMemberConfirmation> {
    this.logger.log(`Adding member ${input.userId} to tenant ${tenantId}`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<TenantMemberApiEntry>(
          `${this.config.apiUrl}/v1/tenants/${tenantId}/members`,
          { userId: input.userId, role: input.role },
          {
            headers: { Authorization: `Bearer ${callerAccessToken}` },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );

      if (!data?.userId || !data?.role) {
        throw new TenantProvisioningUnavailableException(
          'response missing member confirmation',
        );
      }

      return { userId: data.userId, role: data.role };
    } catch (error) {
      if (error instanceof TenantProvisioningUnavailableException) throw error;
      throw this.mapError(error);
    }
  }

  /**
   * ⚠️ Endpoint shape inferred, not confirmed against account-api source —
   * see `ITenantProvisioningPort`'s doc comment for the design/spec conflict
   * this bridges.
   */
  async removeMember(
    callerAccessToken: string,
    tenantId: string,
    targetUserId: string,
  ): Promise<void> {
    this.logger.log(`Removing member ${targetUserId} from tenant ${tenantId}`);

    try {
      await firstValueFrom(
        this.httpService.delete(
          `${this.config.apiUrl}/v1/tenants/${tenantId}/members/${targetUserId}`,
          {
            headers: { Authorization: `Bearer ${callerAccessToken}` },
            timeout: REQUEST_TIMEOUT_MS,
          },
        ),
      );
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private toSlug(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // strip combining diacritics (á → a)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-+|-+$)/g, '');
  }

  private mapError(error: unknown): Error {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;
    const reason =
      status != null
        ? `HTTP ${status}`
        : axiosError?.message || 'unknown error';

    this.logger.error(`Tenant provisioning failed: ${reason}`);
    return new TenantProvisioningUnavailableException(reason);
  }
}
