import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';

import { SisquesAccountConfig } from '@core/config/sisques-account.config';

import { AccountApiTenantAdapter } from './account-api-tenant.adapter';

const axiosResponse = <T>(data: T, status = 201): AxiosResponse<T> =>
  ({
    data,
    status,
    statusText: 'Created',
    headers: {},
    config: {} as never,
  }) as AxiosResponse<T>;

const axiosError = (status: number): { response: { status: number } } => ({
  response: { status },
});

describe('AccountApiTenantAdapter', () => {
  let adapter: AccountApiTenantAdapter;
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
    httpService = { post: jest.fn() } as unknown as jest.Mocked<HttpService>;
    adapter = new AccountApiTenantAdapter(httpService, config);
  });

  it('creates a tenant and returns the platform-issued id', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ id: 'tenant-123' })));

    const tenantId = await adapter.createTenant('caller-token', {
      name: 'My Garden',
    });

    expect(tenantId).toBe('tenant-123');
  });

  it('POSTs to /v1/tenants with appId/name/slug and relays the caller bearer token', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ id: 'tenant-abc' })));

    await adapter.createTenant('caller-token', { name: 'Casa Verde' });

    expect(httpService.post).toHaveBeenCalledWith(
      `${config.apiUrl}/v1/tenants`,
      { appId: config.appId, name: 'Casa Verde', slug: 'casa-verde' },
      expect.objectContaining({
        headers: { Authorization: 'Bearer caller-token' },
      }),
    );
  });

  it('slugifies names with special characters and mixed case', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({ id: 'tenant-xyz' })));

    await adapter.createTenant('caller-token', {
      name: '  Ámber & Co.! Space  ',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ slug: expect.stringMatching(/^[a-z0-9-]+$/) }),
      expect.anything(),
    );
  });

  it('throws TenantProvisioningUnavailableException when the response has no id', async () => {
    httpService.post.mockReturnValue(of(axiosResponse({} as { id: string })));

    await expect(
      adapter.createTenant('caller-token', { name: 'No Id Space' }),
    ).rejects.toThrow('platform tenant provisioning API is unavailable');
  });

  it('throws TenantProvisioningUnavailableException on a 5xx response', async () => {
    httpService.post.mockReturnValue(throwError(() => axiosError(503)));

    await expect(
      adapter.createTenant('caller-token', { name: 'Down Space' }),
    ).rejects.toThrow('HTTP 503');
  });
});
