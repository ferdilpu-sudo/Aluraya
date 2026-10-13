import { build } from 'esbuild';

await build({
  entryPoints: ['sidecar/src/main.ts'],
  outfile: 'sidecar/dist/main.cjs',
  bundle: true,
  external: ['playwright-core'],
  platform: 'node',
  target: 'node24',
  format: 'cjs',
  sourcemap: false,
  legalComments: 'eof',
});
console.log('Sidecar built: sidecar/dist/main.cjs');
