import {defineConfig} from 'vite';

export default defineConfig({
 base:process.env.VITE_BASE_PATH||'/',
 build:{outDir:process.env.VITE_STATIC_HOSTED==='true'?'dist-pages':'dist'}
});
