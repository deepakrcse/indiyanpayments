// `npm run dev`: keeps the Tailwind class list current (see tailwind-classes.mjs) while running
// `next dev`. Extra arguments are passed through, e.g. `npm run dev -- -p 3001`.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { generate, watch } from './tailwind-classes.mjs';

const require = createRequire(import.meta.url);

const result = await generate();
console.log(`[tailwind-classes] ${result.count} candidates, watching src/`);
const stopWatching = watch();

const next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...process.argv.slice(2)], { stdio: 'inherit' });

const shutdown = (signal) => {
  stopWatching();
  if (!next.killed) next.kill(signal);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
next.on('exit', (code) => {
  stopWatching();
  process.exit(code ?? 0);
});
