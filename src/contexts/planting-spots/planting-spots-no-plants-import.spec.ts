/**
 * Static test — SC-16: Dependency Constraint
 *
<<<<<<< HEAD
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
=======
 * The planting-spots bounded context MUST NOT import from src/contexts/plants/.
 * This test scans all TypeScript source files under src/contexts/planting-spots/
 * and asserts no file contains an import referencing src/contexts/plants/ or
 * @contexts/plants.
 *
 * Direction of coupling: plants → planting-spots (Phase 2).
 * planting-spots → plants coupling is strictly forbidden in Phase 1.
>>>>>>> 8fdd5d9 (feat(planting-spots): add e2e and integration tests)
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

<<<<<<< HEAD
const ALLOWED_PATHS = ['infrastructure/adapters/'];

describe('planting-spots bounded context — dependency constraint (SC-16)', () => {
  it('has no import from src/contexts/plants/ or @contexts/plants outside allowed adapters', () => {
    const contextDir = join(__dirname);

=======
describe('planting-spots bounded context — dependency constraint (SC-16)', () => {
  it('has no import from src/contexts/plants/ or @contexts/plants', () => {
    // Resolve the planting-spots directory relative to this file
    const contextDir = join(__dirname);

    // Use find to get all .ts files (excluding this spec file itself)
>>>>>>> 8fdd5d9 (feat(planting-spots): add e2e and integration tests)
    const output = execSync(
      `find "${contextDir}" -name "*.ts" -not -name "*.spec.ts" -not -name "*.e2e-spec.ts"`,
    )
      .toString()
      .trim();

    const files = output.split('\n').filter(Boolean);

    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];

    for (const file of files) {
<<<<<<< HEAD
      const relativePath = file.replace(contextDir + '/', '');

      if (ALLOWED_PATHS.some((allowed) => relativePath.startsWith(allowed))) {
        continue;
      }

      const content = readFileSync(file, 'utf8');

=======
      const content = readFileSync(file, 'utf8');

      // Match any import containing @contexts/plants or contexts/plants
>>>>>>> 8fdd5d9 (feat(planting-spots): add e2e and integration tests)
      const hasPlantImport =
        /from\s+['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/m.test(
          content,
        ) ||
        /require\s*\(\s*['"](@contexts\/plants|.*\/contexts\/plants)[/'"]/.test(
          content,
        );

      if (hasPlantImport) {
<<<<<<< HEAD
        violations.push(relativePath);
=======
        violations.push(file.replace(contextDir + '/', ''));
>>>>>>> 8fdd5d9 (feat(planting-spots): add e2e and integration tests)
      }
    }

    expect(violations).toEqual([]);
  });
});
