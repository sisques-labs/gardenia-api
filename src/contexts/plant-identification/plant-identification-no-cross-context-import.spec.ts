import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('plant-identification bounded context — cross-context imports', () => {
  it('only imports from @contexts/files, @contexts/plants, or @contexts/plant-species exclusively via infrastructure/adapters', () => {
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
      const isAdapter = relativePath.startsWith('infrastructure/adapters/');
      if (isAdapter) continue;

      const content = readFileSync(file, 'utf8');

      const hasForbiddenImport =
        /from\s+['"](@contexts\/files|@contexts\/plants|@contexts\/plant-species)[/'"]/.test(
          content,
        );

      if (hasForbiddenImport) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
