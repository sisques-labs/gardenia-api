import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { SisquesAccountConfig } from '@core/config/sisques-account.config';

import { AccountApiTenantMembershipAdapter } from './account-api-tenant-membership.adapter';
import { TenantMembersApiResponse } from './account-api/types/account-api-tenant.types';

const axiosResponse = (
  data: TenantMembersApiResponse,
): AxiosResponse<TenantMembersApiResponse> =>
  ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {} as never,
  }) as AxiosResponse<TenantMembersApiResponse>;

const axiosError = (status: number): { response: { status: number } } => ({
  response: { status },
});

describe('AccountApiTenantMembershipAdapter', () => {
  let adapter: AccountApiTenantMembershipAdapter;
  let httpService: jest.Mocked<HttpService>;
  const config: SisquesAccountConfig = {
    authEnabled: true,
    issuer: 'https://issuer.example',
    jwksUrl: 'https://issuer.example/.well-known/jwks.json',
    audience: 'gardenia',
    apiUrl: 'https://api.sisques-account.example',
    appId: 'gardenia-app-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    httpService = { get: jest.fn() } as unknown as jest.Mocked<HttpService>;
    adapter = new AccountApiTenantMembershipAdapter(httpService, config);
  });

  it('returns the member list on a 200 response', async () => {
    httpService.get.mockReturnValue(
      of(
        axiosResponse([
          { userId: 'user-1', role: 'OWNER' },
          { userId: 'user-2', role: 'MEMBER' },
        ]),
      ),
    );

    const result = await adapter.listMembers('tenant-1', 'caller-token');

    expect(result).toEqual([
      { userId: 'user-1', role: 'OWNER' },
      { userId: 'user-2', role: 'MEMBER' },
    ]);
  });

  it('GETs /v1/tenants/{id}/members and relays the caller bearer token', async () => {
    httpService.get.mockReturnValue(of(axiosResponse([])));

    await adapter.listMembers('tenant-42', 'caller-token');

    expect(httpService.get).toHaveBeenCalledWith(
      `${config.apiUrl}/v1/tenants/tenant-42/members`,
      expect.objectContaining({
        headers: { Authorization: 'Bearer caller-token' },
      }),
    );
  });

  it('drops malformed entries missing a userId or role', async () => {
    httpService.get.mockReturnValue(
      of(
        axiosResponse([
          { userId: 'user-1' },
          { role: 'MEMBER' },
          { userId: 'user-3', role: 'OWNER' },
        ]),
      ),
    );

    const result = await adapter.listMembers('tenant-1', 'caller-token');

    expect(result).toEqual([{ userId: 'user-3', role: 'OWNER' }]);
  });

  it('returns null on a 403 response — the caller is no longer a member', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(403)));

    const result = await adapter.listMembers('tenant-1', 'caller-token');

    expect(result).toBeNull();
  });

  it('rejects with TenantMembershipQueryUnavailableException on a 5xx response', async () => {
    httpService.get.mockReturnValue(throwError(() => axiosError(503)));

    await expect(
      adapter.listMembers('tenant-1', 'caller-token'),
    ).rejects.toThrow('HTTP 503');
  });

  it('rejects (never returns null) on a timeout/network error', async () => {
    httpService.get.mockReturnValue(
      throwError(() => new Error('ECONNABORTED')),
    );

    await expect(
      adapter.listMembers('tenant-1', 'caller-token'),
    ).rejects.toThrow('tenant-membership API is unavailable');
  });
});
