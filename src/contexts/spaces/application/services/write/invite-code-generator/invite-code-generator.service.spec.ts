import { InviteCodeGeneratorService } from './invite-code-generator.service';

describe('InviteCodeGeneratorService', () => {
  let service: InviteCodeGeneratorService;
  const year = new Date().getUTCFullYear();

  beforeEach(() => {
    service = new InviteCodeGeneratorService();
  });

  it('derives the prefix from the first three letters of the space name', async () => {
    const { code, displayCode } = await service.execute({
      spaceName: 'My Garden',
    });

    expect(code).toMatch(new RegExp(`^MYG${year}[0-9A-Z]{2}$`));
    expect(displayCode).toMatch(new RegExp(`^MYG · ${year} · [0-9A-Z]{2}$`));
  });

  it('pads short names to three characters with X', async () => {
    const { code } = await service.execute({ spaceName: 'Ab' });

    expect(code.startsWith(`ABX${year}`)).toBe(true);
  });

  it('falls back to INV when the name has no letters', async () => {
    const { code } = await service.execute({ spaceName: '123 !!!' });

    expect(code.startsWith(`INV${year}`)).toBe(true);
  });

  it('uppercases letters and ignores non-letters in the prefix', async () => {
    const { code } = await service.execute({ spaceName: 'a1b2c3d' });

    expect(code.startsWith(`ABC${year}`)).toBe(true);
  });

  it('produces a different random suffix across calls', async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add((await service.execute({ spaceName: 'Garden' })).code);
    }

    // Extremely unlikely all 20 collide if the suffix is random.
    expect(codes.size).toBeGreaterThan(1);
  });
});
