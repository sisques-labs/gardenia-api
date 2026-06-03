/**
 * Static test — SC-16: Dependency Constraint
 *
 * The planting-spots bounded context MUST NOT import from src/contexts/plants/,
 * EXCEPT for infrastructure adapters that implement cross-context ports via
 * QueryBus (deliberate Phase 2 coupling points).
 *
 * Allowed: infrastructure/adapters/ — these wire cross-context calls through
 * the QueryBus and are the single seam where planting-spots → plants coupling
 * is permitted (Phase 2).
 *
 * Forbidden everywhere else: domain, application, transport layers must not
 * depend on the plants context.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ALLOWED_PATHS = ['infrastructure/adapters/'];

describe('planting-spots bounded context — dependency constraint (SC-16)', () => {
  it('has no import from src/contexts/plants/ or @contexts/plants outside allowed adapters', () => {
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

      if (ALLOWED_PATHS.some((allowed) => relativePath.startsWith(allowed))) {
        continue;
      }

      const content = readFileSync(file, 'utf8');

      const hasPlantImport =
        /from\s+['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/m.test(
          content,
        ) ||
        /require\s*\(\s*['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/.test(
          content,
        );

      if (hasPlantImport) {
        violations.push(relativePath);
      }
    }

    expect(violations).toEqual([]);
  });
});
