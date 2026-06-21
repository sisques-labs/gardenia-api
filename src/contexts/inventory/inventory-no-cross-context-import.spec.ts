import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('inventory bounded context — no cross-context imports', () => {
  it('has no import from plants, plant-species or care-log', () => {
    const contextDir = join(__dirname);

    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    const forbidden =
      /from\s+['"](@contexts\/plants|@contexts\/plant-species|@contexts\/care-log|.*\/contexts\/plants|.*\/contexts\/plant-species|.*\/contexts\/care-log)[/'"]/;

    for (const file of files) {
      const relativePath = file.replace(contextDir + '/', '');
      const content = readFileSync(file, 'utf8');
      if (forbidden.test(content)) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
