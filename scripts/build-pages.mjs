import {build} from 'vite';
import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await import('./validate-deliveries.mjs');
process.env.VITE_STATIC_HOSTED='true';
await build();
const release=createHash('sha256').update(await readFile('dist-pages/index.html')).digest('hex').slice(0,16);await writeFile('dist-pages/sw.js',(await readFile('public/sw.js','utf8')).replace('__FEED7_VERSION__',release));
await writeFile('dist-pages/.nojekyll','');
