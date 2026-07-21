import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('notifications bounded context — no cross-context imports', () => {
  it('has no import from any other bounded context, except the auth transversal allowlist', () => {
    const contextDir = join(__dirname);

    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    // Allowed: auth's transversal infra (JWT guard, @CurrentUser decorator) —
    // the documented exception to the cross-context boundary rule.
    const allowedAuthImports =
      /@contexts\/auth\/infrastructure\/(guards\/jwt-auth\.guard|decorators\/current-user\.decorator)/;
    const forbidden = /from\s+['"](@contexts\/(?!notifications\/)[^'"]+)['"]/g;

    const violations: string[] = [];

    for (const file of files) {
      const relativePath = file.replace(contextDir + '/', '');
      const content = readFileSync(file, 'utf8');
      let match: RegExpExecArray | null;
      forbidden.lastIndex = 0;
      while ((match = forbidden.exec(content)) !== null) {
        if (allowedAuthImports.test(match[1])) continue;
        violations.push(`${relativePath}: ${match[1]}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
