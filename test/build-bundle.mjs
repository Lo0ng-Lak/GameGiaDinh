// Build bundle test: gom game logic + stub three thành 1 file CJS để chạy trong
// Node (không cần trình duyệt). Bundle ra /tmp — không đi vào repo.
// Chạy: node test/build-bundle.mjs
import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || '/tmp/game-test-bundle.cjs';

await build({
  entryPoints: [path.join(root, 'entry.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: out,
  alias: { three: path.join(root, 'three-stub.mjs') },
  logLevel: 'warning',
});
console.log('bundle ok ->', out);
