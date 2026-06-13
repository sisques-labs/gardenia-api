import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('harvests bounded context — no cross-context imports', () => {
  it('has no import from @contexts/plants or @contexts/plant-species', () => {
    const contextDir = join(__dirname);

    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of files) {
      const relativePath = file.replace(contextDir + '/', '');
      const content = readFileSync(file, 'utf8');

      const hasForbiddenImport =
        /from\s+['"](@contexts\/plants|@contexts\/plant-species|.*\/contexts\/plants|.*\/contexts\/plant-species)[/'"]/.test(
          content,
        ) ||
        /require\s*\(\s*['"](@contexts\/plants|@contexts\/plant-species|.*\/contexts\/plants|.*\/contexts\/plant-species)[/'"]/.test(
          content,
        );

      if (hasForbiddenImport) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
