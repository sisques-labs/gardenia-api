/**
 * Static test — SC-16: Dependency Constraint
 *
 * The planting-spots bounded context MUST NOT import from src/contexts/plants/.
 * This test scans all TypeScript source files under src/contexts/planting-spots/
 * and asserts no file contains an import referencing src/contexts/plants/ or
 * @contexts/plants.
 *
 * Direction of coupling: plants → planting-spots (Phase 2).
 * planting-spots → plants coupling is strictly forbidden in Phase 1.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('planting-spots bounded context — dependency constraint (SC-16)', () => {
  it('has no import from src/contexts/plants/ or @contexts/plants', () => {
    // Resolve the planting-spots directory relative to this file
    const contextDir = join(__dirname);

    // Use find to get all .ts files (excluding this spec file itself)
    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf8');

      // Match any import containing @contexts/plants or contexts/plants
      const hasPlantImport =
        /from\s+['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/m.test(
          content,
        ) ||
        /require\s*\(\s*['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/.test(
          content,
        );

      if (hasPlantImport) {
        violations.push(file.replace(contextDir + '/', ''));
      }
    }

    expect(violations).toEqual([]);
  });
});
