import { CreateQrCommand } from './create-qr.command';

const TARGET_URL = 'http://localhost:3000/plants/example?spaceId=abc';
const SPACE_ID = '550e8400-e29b-41d4-a716-446655440002';
const FUTURE_DATE = new Date(Date.now() + 1000 * 60 * 60 * 24);
const PAST_DATE = new Date('2020-01-01');

describe('CreateQrCommand', () => {
  it('creates command without expiresAt', () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
    });

    expect(command.expiresAt).toBeNull();
  });

  it('creates command with a future expiresAt', () => {
    const command = new CreateQrCommand({
      targetUrl: TARGET_URL,
      spaceId: SPACE_ID,
      expiresAt: FUTURE_DATE,
    });

    expect(command.expiresAt?.value).toBe(FUTURE_DATE);
  });

  it('throws when expiresAt is in the past', () => {
    expect(
      () =>
        new CreateQrCommand({
          targetUrl: TARGET_URL,
          spaceId: SPACE_ID,
          expiresAt: PAST_DATE,
        }),
    ).toThrow('expiresAt must be a future date');
  });

  it('throws when expiresAt equals now (boundary)', () => {
    const now = new Date();

    expect(
      () =>
        new CreateQrCommand({
          targetUrl: TARGET_URL,
          spaceId: SPACE_ID,
          expiresAt: now,
        }),
    ).toThrow('expiresAt must be a future date');
  });
});
