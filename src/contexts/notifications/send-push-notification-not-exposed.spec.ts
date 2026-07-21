import { readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

describe('SendPushNotificationCommand — no client-facing transport', () => {
  it('is not referenced by any REST controller, GraphQL resolver, or MCP tool', () => {
    const scanDirs = [
      'transport/rest',
      'transport/graphql',
      'transport/mcp',
    ].map((dir) => join(__dirname, dir));

    const violations: string[] = [];

    for (const dir of scanDirs) {
      const output = execSync(
        `find "${dir}" -name "*.ts" -not -name "*.spec.ts" 2>/dev/null || true`,
      )
        .toString()
        .trim();

      const files = output.split('\n').filter(Boolean);

      for (const file of files) {
        const content = readFileSync(file, 'utf8');
        if (content.includes('SendPushNotificationCommand')) {
          violations.push(file.replace(join(__dirname) + '/', ''));
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
