import { Response } from 'express';

import { clearRefreshCookie, setRefreshCookie } from './cookie.helper';

const buildMockResponse = () =>
  ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  }) as unknown as jest.Mocked<Response>;

describe('clearRefreshCookie', () => {
  it('calls clearCookie with httpOnly, secure, sameSite, and path options', () => {
    const res = buildMockResponse();

    clearRefreshCookie(res);

    expect(res.clearCookie).toHaveBeenCalledTimes(1);
    const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    expect(options).toHaveProperty('secure');
  });

  it('does NOT include maxAge in the clear options', () => {
    const res = buildMockResponse();

    clearRefreshCookie(res);

    const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
    expect(options).not.toHaveProperty('maxAge');
  });
});

describe('setRefreshCookie', () => {
  it('sets cookie with all required attributes', () => {
    const res = buildMockResponse();

    setRefreshCookie(res, 'some-token');

    expect(res.cookie).toHaveBeenCalledTimes(1);
    const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
    expect(options).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });
    expect(options).toHaveProperty('maxAge');
  });
});
