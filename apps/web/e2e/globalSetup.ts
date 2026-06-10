import { execFileSync } from 'child_process';
import { resolve } from 'path';

// Reset + migrate the test DB before the suite runs. Done in a separate Node
// process (not in this esbuild-compiled module) to avoid @neondatabase/serverless
// CJS/ESM interop errors inside Playwright's runtime.
export default function globalSetup() {
  const script = resolve(__dirname, 'scripts/reset-test-db.mjs');
  execFileSync('node', [script], { stdio: 'inherit' });
}
