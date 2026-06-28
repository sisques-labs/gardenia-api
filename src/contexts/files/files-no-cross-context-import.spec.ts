import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('files bounded context — no cross-context imports', () => {
  it('imports no other bounded context under @contexts/*', () => {
    const contextDir = join(__dirname);

    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);
    expect(files.length).toBeGreaterThan(0);

    // Any @contexts/<other>/ import where <other> is neither "files" nor
    // "auth" (the auth jwt/current-user guards are on the repo-wide exempt
    // allowlist, importable from any context).
    const forbidden =
      /from\s+['"](?:.*\/)?@contexts\/(?!(?:files|auth)[/'"])([\w-]+)/;
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (forbidden.test(content)) {
        violations.push(file.replace(contextDir + '/', ''));
      }
    }

    expect(violations).toEqual([]);
  });
});
