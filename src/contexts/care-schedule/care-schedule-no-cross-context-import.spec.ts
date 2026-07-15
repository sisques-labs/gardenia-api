import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('care-schedule bounded context — no cross-context imports', () => {
  it('has no import from another bounded context outside infrastructure/adapters', () => {
    const contextDir = join(__dirname);

    // Per the project convention, reaching another bounded context is allowed
    // EXCLUSIVELY from infrastructure/adapters/ (a port implementation), so the
    // adapters directory is excluded from this scan.
    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts" -not -path "*/infrastructure/adapters/*"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    const forbidden =
      /from\s+['"](@contexts\/plants|@contexts\/plant-species|@contexts\/care-log|@contexts\/inventory|@contexts\/harvests|@contexts\/planting-spots|@contexts\/weather|@contexts\/spaces|@contexts\/files|@contexts\/notifications)[/'"]/;

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
