import {build} from 'vite';
import {writeFile} from 'node:fs/promises';
process.env.VITE_STATIC_HOSTED='true';
await build();
await writeFile('dist-pages/.nojekyll','');
